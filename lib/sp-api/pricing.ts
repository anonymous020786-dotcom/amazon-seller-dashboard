import { getSpApiClient } from "./client";
import { cached } from "../cache";
import type { SellerContext } from "./domains";

const TTL_OFFERS = 15 * 60 * 1000;

export interface OfferSummary {
  yourPrice: number | null;
  buyBoxPrice: number | null;
  currency: string;
  offerCount: number;
  isFeaturedOffer: boolean;
}

interface OfferEntry {
  SubCondition?: string;
  IsBuyBoxWinner?: boolean;
  IsFeaturedMerchant?: boolean;
  ListingPrice?: { Amount?: number; CurrencyCode?: string };
  MyOffer?: boolean;
}
interface GetListingOffersResponse {
  payload?: {
    Offers?: OfferEntry[];
  };
  Offers?: OfferEntry[];
}

export async function getOffersForSku(seller: SellerContext, sku: string): Promise<OfferSummary | null> {
  return cached(`${seller.sellerId}:offers:${sku}`, TTL_OFFERS, async () => {
    const client = getSpApiClient(seller.refreshToken);
    const res = (await client.callAPI({
      operation: "productPricing.getListingOffers",
      path: { SellerSKU: sku },
      query: {
        MarketplaceId: seller.marketplaceId,
        ItemCondition: "New",
      },
      options: { version: "v0" },
    })) as GetListingOffersResponse;

    const offers = res.payload?.Offers ?? res.Offers ?? [];
    if (offers.length === 0) return null;

    const mine = offers.find((o) => o.MyOffer);
    const buyBoxHolder = offers.find((o) => o.IsBuyBoxWinner) ?? offers[0];

    return {
      yourPrice: mine?.ListingPrice?.Amount ?? null,
      buyBoxPrice: buyBoxHolder?.ListingPrice?.Amount ?? null,
      currency: buyBoxHolder?.ListingPrice?.CurrencyCode ?? "INR",
      offerCount: offers.length,
      isFeaturedOffer: mine?.IsBuyBoxWinner ?? false,
    };
  });
}
