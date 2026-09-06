import Link from "next/link";
import { resolveActiveSeller } from "@/lib/sellers/resolve";
import { getShipmentItems } from "@/lib/sp-api/shipments";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SectionCard } from "@/components/dashboard/SectionCard";

export const dynamic = "force-dynamic";

export default async function ShipmentDetailPage(props: PageProps<"/dashboard/shipments/[shipmentId]">) {
  const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
  const requestedId = typeof searchParams.seller === "string" ? searchParams.seller : undefined;
  const { sellers, seller, activeId } = resolveActiveSeller(requestedId);
  const sellerContext = { sellerId: seller.id, refreshToken: seller.refreshToken, marketplaceId: seller.marketplaceId };

  let items: Awaited<ReturnType<typeof getShipmentItems>> = [];
  let error: string | undefined;
  try {
    items = await getShipmentItems(sellerContext, params.shipmentId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <DashboardHeader
        title="Shipments"
        subtitle={seller.label}
        sellers={sellers}
        activeId={activeId}
        activePath="/dashboard/shipments"
      />

      <Link
        href={`/dashboard/shipments?seller=${activeId}`}
        className="mb-4 inline-block text-sm text-[var(--series-1)] hover:underline"
      >
        ← All shipments
      </Link>

      <SectionCard title={`Items in ${params.shipmentId}`} error={error}>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No item data for this shipment.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--gridline)] text-[var(--text-muted)]">
                <th className="pb-2 font-medium">SKU</th>
                <th className="pb-2 font-medium text-right">Shipped</th>
                <th className="pb-2 font-medium text-right">Received</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sku} className="border-b border-[var(--gridline)] last:border-0">
                  <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">{item.sku}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--text-primary)]">{item.quantityShipped}</td>
                  <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                    {item.quantityReceived}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
