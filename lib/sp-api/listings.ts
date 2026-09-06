import { getSpApiClient } from "./client";
import { cached, invalidate } from "../cache";
import type { SellerContext } from "./domains";

const TTL_LISTINGS = 5 * 60 * 1000;

export interface ListingSummary {
  sku: string;
  asin: string;
  productType: string;
  title: string;
  imageUrl: string | null;
  status: string;
  price: number | null;
  currency: string;
  quantity: number | null;
}

interface ListingsSearchItem {
  sku: string;
  summaries?: {
    asin?: string;
    productType?: string;
    itemName?: string;
    status?: string[];
    mainImage?: { link?: string };
  }[];
  offers?: { price?: { amount?: number; currencyCode?: string } }[];
  fulfillmentAvailability?: { quantity?: number }[];
}
interface ListingsSearchResponse {
  numberOfResults?: number;
  items?: ListingsSearchItem[];
}

export async function getListings(seller: SellerContext): Promise<ListingSummary[]> {
  return cached(`${seller.sellerId}:listings`, TTL_LISTINGS, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = (await client.callAPI({
      operation: "listingsItems.searchListingsItems",
      path: { sellerId: seller.sellerId },
      query: {
        marketplaceIds: [seller.marketplaceId],
        includedData: ["summaries", "offers", "fulfillmentAvailability"],
        pageSize: 20,
      },
      options: { version: "2021-08-01" },
    })) as ListingsSearchResponse;

    return (res.items ?? []).map((item): ListingSummary => {
      const summary = item.summaries?.[0];
      const offer = item.offers?.[0];
      const availability = item.fulfillmentAvailability?.[0];
      return {
        sku: item.sku,
        asin: summary?.asin ?? "",
        productType: summary?.productType ?? "",
        title: summary?.itemName ?? item.sku,
        imageUrl: summary?.mainImage?.link ?? null,
        status: summary?.status?.[0] ?? "UNKNOWN",
        price: offer?.price?.amount ?? null,
        currency: offer?.price?.currencyCode ?? "INR",
        quantity: availability?.quantity ?? null,
      };
    });
  });
}

async function patchListing(
  seller: SellerContext,
  sku: string,
  productType: string,
  patches: { op: "replace"; path: string; value: unknown[] }[]
): Promise<void> {
  const client = getSpApiClient(seller.refreshToken);
  await client.callAPI({
    operation: "listingsItems.patchListingsItem",
    path: { sellerId: seller.sellerId, sku },
    query: { marketplaceIds: [seller.marketplaceId] },
    body: { productType, patches },
    options: { version: "2021-08-01" },
  });
  invalidate(`${seller.sellerId}:listings`);
}

// Standard "purchasable_offer" / "fulfillment_availability" attributes cover most
// product types; a handful of specialized categories use a different schema — if a
// patch fails for those, the fix is a product-type-specific attribute path, not this
// function's shape.
export async function updateListingPrice(
  seller: SellerContext,
  sku: string,
  productType: string,
  newPrice: number,
  currency: string
): Promise<void> {
  await patchListing(seller, sku, productType, [
    {
      op: "replace",
      path: "/attributes/purchasable_offer",
      value: [
        {
          marketplace_id: seller.marketplaceId,
          currency,
          our_price: [{ schedule: [{ value_with_tax: newPrice }] }],
        },
      ],
    },
  ]);
}

export async function updateListingQuantity(
  seller: SellerContext,
  sku: string,
  productType: string,
  newQuantity: number
): Promise<void> {
  await patchListing(seller, sku, productType, [
    {
      op: "replace",
      path: "/attributes/fulfillment_availability",
      value: [{ fulfillment_channel_code: "DEFAULT", quantity: newQuantity }],
    },
  ]);
}
