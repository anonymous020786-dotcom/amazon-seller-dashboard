import { getSpApiClient } from "./client";
import { cached } from "../cache";
import type { SellerContext } from "./domains";

const TTL_BRAND_ANALYTICS = 24 * 60 * 60 * 1000;

export interface SearchTermRow {
  searchTerm: string;
  searchFrequencyRank: number;
  clickShare: number;
  conversionShare: number;
}

export interface BrandAnalyticsResult {
  available: boolean;
  rows: SearchTermRow[];
  message?: string;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

// Only produces data for Brand Registered sellers — most sellers will see the
// graceful "unavailable" fallback rather than real rows, same pattern as the
// Seller Feedback best-effort section.
export async function getSearchTermsReport(seller: SellerContext, days = 30): Promise<BrandAnalyticsResult> {
  return cached(`${seller.sellerId}:brand-analytics:${days}`, TTL_BRAND_ANALYTICS, async () => {
    try {
      const client = getSpApiClient(seller.refreshToken);
      const result = await client.downloadReport({
        body: {
          reportType: "GET_BRAND_ANALYTICS_SEARCH_TERMS_REPORT",
          marketplaceIds: [seller.marketplaceId],
          dataStartTime: daysAgoIso(days),
          dataEndTime: new Date().toISOString(),
          reportOptions: { reportPeriod: "WEEK" },
        },
        interval: 8000,
        cancel_after: 20,
        download: { json: true },
      });

      const rows: Record<string, unknown>[] = Array.isArray(result)
        ? result
        : (result as { dataByDepartmentAndSearchTerm?: Record<string, unknown>[] })?.dataByDepartmentAndSearchTerm ??
          [];

      return {
        available: true,
        rows: rows.slice(0, 10).map(
          (r): SearchTermRow => ({
            searchTerm: String(r.searchTerm ?? ""),
            searchFrequencyRank: Number(r.searchFrequencyRank ?? 0),
            clickShare: Number(r.clickShareOfTopThree ?? r.clickShare ?? 0),
            conversionShare: Number(r.conversionShareOfTopThree ?? r.conversionShare ?? 0),
          })
        ),
      };
    } catch {
      return {
        available: false,
        rows: [],
        message: "Brand Analytics reports require Brand Registry enrollment, or aren't available for this seller.",
      };
    }
  });
}
