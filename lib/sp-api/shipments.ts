import { getSpApiClient } from "./client";
import { cached } from "../cache";
import type { SellerContext } from "./domains";

const TTL_SHIPMENTS = 15 * 60 * 1000;

export interface InboundShipment {
  shipmentId: string;
  shipmentName: string;
  status: string;
  destinationFulfillmentCenter: string;
  lastUpdated: string;
}

export interface ShipmentLineItem {
  sku: string;
  quantityShipped: number;
  quantityReceived: number;
}

interface ShipmentEntry {
  ShipmentId: string;
  ShipmentName?: string;
  ShipmentStatus?: string;
  DestinationFulfillmentCenterId?: string;
  LastUpdatedDate?: string;
}
interface GetShipmentsResponse {
  payload?: { ShipmentData?: ShipmentEntry[] };
  ShipmentData?: ShipmentEntry[];
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function getInboundShipments(seller: SellerContext, days = 90): Promise<InboundShipment[]> {
  return cached(`${seller.sellerId}:shipments:${days}`, TTL_SHIPMENTS, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = (await client.callAPI({
      operation: "fulfillmentInbound.getShipments",
      query: {
        QueryType: "LAST_UPDATED_TIME",
        MarketplaceId: seller.marketplaceId,
        LastUpdatedAfter: daysAgoIso(days),
        LastUpdatedBefore: new Date().toISOString(),
      },
      options: { version: "v0" },
    })) as GetShipmentsResponse;

    const shipments = res.payload?.ShipmentData ?? res.ShipmentData ?? [];
    return shipments.map(
      (s): InboundShipment => ({
        shipmentId: s.ShipmentId,
        shipmentName: s.ShipmentName ?? s.ShipmentId,
        status: s.ShipmentStatus ?? "UNKNOWN",
        destinationFulfillmentCenter: s.DestinationFulfillmentCenterId ?? "",
        lastUpdated: s.LastUpdatedDate ?? "",
      })
    );
  });
}

interface ShipmentItemEntry {
  SellerSKU: string;
  QuantityShipped?: number;
  QuantityReceived?: number;
}
interface GetShipmentItemsResponse {
  payload?: { ItemData?: ShipmentItemEntry[] };
  ItemData?: ShipmentItemEntry[];
}

export async function getShipmentItems(seller: SellerContext, shipmentId: string): Promise<ShipmentLineItem[]> {
  return cached(`${seller.sellerId}:shipment-items:${shipmentId}`, TTL_SHIPMENTS, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = (await client.callAPI({
      operation: "fulfillmentInbound.getShipmentItemsByShipmentId",
      path: { shipmentId },
      query: { MarketplaceId: seller.marketplaceId },
      options: { version: "v0" },
    })) as GetShipmentItemsResponse;

    const items = res.payload?.ItemData ?? res.ItemData ?? [];
    return items.map(
      (i): ShipmentLineItem => ({
        sku: i.SellerSKU,
        quantityShipped: i.QuantityShipped ?? 0,
        quantityReceived: i.QuantityReceived ?? 0,
      })
    );
  });
}
