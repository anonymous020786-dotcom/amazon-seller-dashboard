import { resolveActiveSeller } from "@/lib/sellers/resolve";
import { getListings } from "@/lib/sp-api/listings";
import { getOffersForSku } from "@/lib/sp-api/pricing";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ListingsTable, type ListingRow } from "@/components/dashboard/ListingsTable";

export const dynamic = "force-dynamic";

export default async function ListingsPage(props: PageProps<"/dashboard/listings">) {
  const searchParams = await props.searchParams;
  const requestedId = typeof searchParams.seller === "string" ? searchParams.seller : undefined;
  const { sellers, seller, activeId } = resolveActiveSeller(requestedId);
  const sellerContext = { sellerId: seller.id, refreshToken: seller.refreshToken, marketplaceId: seller.marketplaceId };

  let listings: ListingRow[] = [];
  let error: string | undefined;
  try {
    const summaries = await getListings(sellerContext);
    const offers = await Promise.all(summaries.map((s) => getOffersForSku(sellerContext, s.sku)));
    listings = summaries.map((s, i) => ({ ...s, offer: offers[i] }));
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <DashboardHeader
        title="Listings"
        subtitle={seller.label}
        sellers={sellers}
        activeId={activeId}
        activePath="/dashboard/listings"
      />

      <SectionCard title="Your listings" error={error}>
        <ListingsTable sellerId={seller.id} listings={listings} />
      </SectionCard>
    </div>
  );
}
