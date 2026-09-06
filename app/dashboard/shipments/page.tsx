import Link from "next/link";
import { resolveActiveSeller } from "@/lib/sellers/resolve";
import { getInboundShipments } from "@/lib/sp-api/shipments";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SectionCard } from "@/components/dashboard/SectionCard";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  working: "bg-[var(--gridline)] text-[var(--text-secondary)]",
  shipped: "bg-[var(--status-warning)]/15 text-[var(--status-warning)]",
  in_transit: "bg-[var(--status-warning)]/15 text-[var(--status-warning)]",
  delivered: "bg-[var(--status-good)]/10 text-[var(--status-good)]",
  checked_in: "bg-[var(--status-good)]/10 text-[var(--status-good)]",
  receiving: "bg-[var(--status-good)]/10 text-[var(--status-good)]",
  closed: "bg-[var(--status-good)]/10 text-[var(--status-good)]",
  cancelled: "bg-[var(--status-critical)]/10 text-[var(--status-critical)]",
  error: "bg-[var(--status-critical)]/10 text-[var(--status-critical)]",
};

export default async function ShipmentsPage(props: PageProps<"/dashboard/shipments">) {
  const searchParams = await props.searchParams;
  const requestedId = typeof searchParams.seller === "string" ? searchParams.seller : undefined;
  const { sellers, seller, activeId } = resolveActiveSeller(requestedId);
  const sellerContext = { sellerId: seller.id, refreshToken: seller.refreshToken, marketplaceId: seller.marketplaceId };

  let shipments: Awaited<ReturnType<typeof getInboundShipments>> = [];
  let error: string | undefined;
  try {
    shipments = await getInboundShipments(sellerContext, 90);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <DashboardHeader
        title="Shipments"
        subtitle={`${seller.label} · FBA inbound, last 90 days`}
        sellers={sellers}
        activeId={activeId}
        activePath="/dashboard/shipments"
      />

      <SectionCard title="Inbound shipments" error={error}>
        {shipments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No inbound shipments in this window.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--gridline)] text-[var(--text-muted)]">
                  <th className="pb-2 font-medium">Shipment</th>
                  <th className="pb-2 font-medium">Destination FC</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Last updated</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.shipmentId} className="border-b border-[var(--gridline)] last:border-0">
                    <td className="py-2 text-[var(--text-primary)]">{s.shipmentName}</td>
                    <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">
                      {s.destinationFulfillmentCenter}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[s.status.toLowerCase()] ?? "bg-[var(--gridline)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 text-[var(--text-secondary)]">
                      {s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/dashboard/shipments/${encodeURIComponent(s.shipmentId)}?seller=${activeId}`}
                        className="text-sm font-medium text-[var(--series-1)] hover:underline"
                      >
                        View items
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
