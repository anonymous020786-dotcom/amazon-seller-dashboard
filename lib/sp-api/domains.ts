import { getSpApiClient } from "./client";
import { cached } from "../cache";
import type {
  RecentOrder,
  SalesMetricPoint,
  InventoryItem,
  ReturnRecord,
  FinanceSummary,
  FeedbackSummary,
} from "./types";

export interface SellerContext {
  sellerId: string;
  refreshToken: string;
  marketplaceId: string;
}

const TTL = {
  orders: 5 * 60 * 1000,
  sales: 15 * 60 * 1000,
  inventory: 15 * 60 * 1000,
  returns: 60 * 60 * 1000,
  finance: 30 * 60 * 1000,
  feedback: 60 * 60 * 1000,
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function getRecentOrders(seller: SellerContext, days = 7): Promise<RecentOrder[]> {
  return cached(`${seller.sellerId}:orders:${days}`, TTL.orders, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = await client.callAPI({
      operation: "getOrders",
      endpoint: "orders",
      query: {
        MarketplaceIds: [seller.marketplaceId],
        CreatedAfter: daysAgoIso(days),
      },
      options: { version: "v0" },
    });

    // The package's types cover both the stable v0 Orders API and the newer
    // 2026-01-01 version; discriminate per-order since the wrapper shape
    // (`Orders` vs `orders`) doesn't guarantee which order shape is inside.
    const orders = "Orders" in res ? res.Orders : res.orders;

    return orders.map((o): RecentOrder => {
      if ("AmazonOrderId" in o) {
        return {
          orderId: o.AmazonOrderId,
          purchaseDate: o.PurchaseDate,
          status: o.OrderStatus,
          total: o.OrderTotal?.Amount ? Number(o.OrderTotal.Amount) : 0,
          currency: o.OrderTotal?.CurrencyCode ?? "INR",
          itemsShipped: o.NumberOfItemsShipped ?? 0,
          itemsUnshipped: o.NumberOfItemsUnshipped ?? 0,
        };
      }

      const itemsShipped =
        o.orderItems?.reduce((sum, item) => sum + (item.fulfillment?.quantityFulfilled ?? 0), 0) ?? 0;
      const itemsUnshipped =
        o.orderItems?.reduce((sum, item) => sum + (item.fulfillment?.quantityUnfulfilled ?? 0), 0) ?? 0;

      return {
        orderId: o.orderId,
        purchaseDate: o.createdTime ?? "",
        status: o.orderStatus ?? "UNKNOWN",
        total: o.proceeds?.grandTotal ? Number(o.proceeds.grandTotal.amount) : 0,
        currency: o.proceeds?.grandTotal?.currencyCode ?? "INR",
        itemsShipped,
        itemsUnshipped,
      };
    });
  });
}

export async function getSalesMetrics(seller: SellerContext, days = 30): Promise<SalesMetricPoint[]> {
  return cached(`${seller.sellerId}:sales:${days}`, TTL.sales, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const start = daysAgoIso(days);
    const end = new Date().toISOString();
    const res = await client.callAPI({
      operation: "getOrderMetrics",
      endpoint: "sales",
      query: {
        marketplaceIds: [seller.marketplaceId],
        interval: `${start}--${end}`,
        granularity: "Day",
      },
    });

    const points = res?.payload ?? res ?? [];
    return points.map(
      (p: {
        interval: string;
        orderCount: number;
        unitCount: number;
        totalSales?: { amount: number; currencyCode: string };
      }): SalesMetricPoint => ({
        date: p.interval.split("--")[0].slice(0, 10),
        revenue: p.totalSales?.amount ?? 0,
        currency: p.totalSales?.currencyCode ?? "INR",
        orderCount: p.orderCount ?? 0,
        unitCount: p.unitCount ?? 0,
      })
    );
  });
}

export async function getInventorySummary(seller: SellerContext): Promise<InventoryItem[]> {
  return cached(`${seller.sellerId}:inventory`, TTL.inventory, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = await client.callAPI({
      operation: "getInventorySummaries",
      endpoint: "fbaInventory",
      query: {
        granularityType: "Marketplace",
        granularityId: seller.marketplaceId,
        marketplaceIds: [seller.marketplaceId],
        details: true,
      },
    });

    const summaries = res.inventorySummaries ?? [];
    return summaries.map(
      (s): InventoryItem => ({
        sku: s.sellerSku ?? "",
        asin: s.asin ?? "",
        fulfillable: s.inventoryDetails?.fulfillableQuantity ?? 0,
        totalQuantity: s.totalQuantity ?? 0,
      })
    );
  });
}

export async function getReturnsReport(seller: SellerContext, days = 30): Promise<ReturnRecord[]> {
  return cached(`${seller.sellerId}:returns:${days}`, TTL.returns, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const result = await client.downloadReport({
      body: {
        reportType: "GET_FLAT_FILE_RETURNS_DATA_BY_RETURN_DATE",
        marketplaceIds: [seller.marketplaceId],
        dataStartTime: daysAgoIso(days),
        dataEndTime: new Date().toISOString(),
      },
      interval: 8000,
      cancel_after: 20,
      download: { json: true },
    });

    const rows: Record<string, string>[] = Array.isArray(result) ? result : [];
    return rows.map(
      (r): ReturnRecord => ({
        returnDate: r["return-date"] ?? "",
        orderId: r["order-id"] ?? "",
        sku: r["sku"] ?? "",
        quantity: Number(r["return-quantity"] ?? 0),
        reason: r["return-reason"] ?? "unknown",
      })
    );
  });
}

export async function getFinancialSummary(seller: SellerContext, days = 7): Promise<FinanceSummary> {
  return cached(`${seller.sellerId}:finance:${days}`, TTL.finance, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = await client.callAPI({
      operation: "listFinancialEvents",
      endpoint: "finances",
      query: {
        PostedAfter: daysAgoIso(days),
        PostedBefore: new Date().toISOString(),
      },
    });

    const events = res.FinancialEvents ?? {};
    let revenue = 0;
    let fees = 0;
    let currency = "INR";
    let eventCount = 0;

    const shipments = events.ShipmentEventList ?? [];

    for (const shipment of shipments) {
      for (const item of shipment.ShipmentItemList ?? []) {
        for (const charge of item.ItemChargeList ?? []) {
          if (charge.ChargeAmount?.CurrencyAmount != null) {
            revenue += charge.ChargeAmount.CurrencyAmount;
            currency = charge.ChargeAmount.CurrencyCode ?? currency;
            eventCount++;
          }
        }
        for (const fee of item.ItemFeeList ?? []) {
          if (fee.FeeAmount?.CurrencyAmount != null) {
            fees += Math.abs(fee.FeeAmount.CurrencyAmount);
          }
        }
      }
    }

    return { revenue, fees, net: revenue - fees, currency, eventCount };
  });
}

// Best-effort: Amazon does not expose a full "Account Health" API to third-party
// apps. This calls the Seller Feedback endpoint as a partial proxy and degrades
// gracefully if the operation isn't authorized for this app.
export async function getFeedbackSummary(seller: SellerContext): Promise<FeedbackSummary> {
  return cached(`${seller.sellerId}:feedback`, TTL.feedback, async () => {
    try {
      const client = getSpApiClient(seller.refreshToken);
      const res = await client.callAPI({
        operation: "getFeedbackSummary",
        endpoint: "sellerFeedback",
        query: { marketplaceId: seller.marketplaceId },
      });
      const payload = res?.payload ?? res ?? {};
      return {
        available: true,
        positiveCount: payload.positiveCount,
        neutralCount: payload.neutralCount,
        negativeCount: payload.negativeCount,
      };
    } catch {
      return {
        available: false,
        message:
          "Account health / feedback metrics aren't exposed to this app via public SP-API. Check Seller Central directly for ODR, late-dispatch rate, and policy compliance.",
      };
    }
  });
}
