import { getSpApiClient } from "./client";
import { cached } from "../cache";
import type { SellerContext } from "./domains";

const TTL_CATALOG = 24 * 60 * 60 * 1000; // product data rarely changes

export interface CatalogSummary {
  asin: string;
  title: string;
  imageUrl: string | null;
  brand: string | null;
}

interface CatalogItemSummaryEntry {
  itemName?: string;
  brand?: string;
}
interface CatalogItemImage {
  link: string;
  variant?: string;
}
interface CatalogItemResponse {
  asin: string;
  summaries?: CatalogItemSummaryEntry[];
  images?: { marketplaceId: string; images: CatalogItemImage[] }[];
}

export async function getCatalogSummary(seller: SellerContext, asin: string): Promise<CatalogSummary> {
  return cached(`${seller.sellerId}:catalog:${asin}`, TTL_CATALOG, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = (await client.callAPI({
      operation: "catalogItems.getCatalogItem",
      path: { asin },
      query: {
        marketplaceIds: [seller.marketplaceId],
        includedData: ["summaries", "images"],
      },
      options: { version: "2022-04-01" },
    })) as CatalogItemResponse;

    const summary = res.summaries?.[0];
    const mainImage = res.images?.[0]?.images.find((img) => img.variant === "MAIN") ?? res.images?.[0]?.images[0];

    return {
      asin: res.asin,
      title: summary?.itemName ?? asin,
      imageUrl: mainImage?.link ?? null,
      brand: summary?.brand ?? null,
    };
  });
}
