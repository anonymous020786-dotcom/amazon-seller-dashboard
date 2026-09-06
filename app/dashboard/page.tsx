import { loadDashboardData } from "@/lib/sp-api/dashboard-data";
import { getSearchTermsReport } from "@/lib/sp-api/brandAnalytics";
import { resolveActiveSeller } from "@/lib/sellers/resolve";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { InventoryTable } from "@/components/dashboard/InventoryTable";
import { ReturnsTable } from "@/components/dashboard/ReturnsTable";
import { SalesChart } from "@/components/charts/SalesChart";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const requestedId = typeof searchParams.seller === "string" ? searchParams.seller : undefined;
  const { sellers, seller, activeId } = resolveActiveSeller(requestedId);

  const sellerContext = { sellerId: seller.id, refreshToken: seller.refreshToken, marketplaceId: seller.marketplaceId };
  const [data, brandAnalytics] = await Promise.all([
    loadDashboardData(sellerContext),
    getSearchTermsReport(sellerContext),
  ]);

  const revenue30 = data.sales.data.reduce((sum, p) => sum + p.revenue, 0);
  const orders30 = data.sales.data.reduce((sum, p) => sum + p.orderCount, 0);
  const units30 = data.sales.data.reduce((sum, p) => sum + p.unitCount, 0);
  const currency = data.sales.data[0]?.currency ?? "INR";
  const avgOrderValue = orders30 > 0 ? revenue30 / orders30 : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <DashboardHeader
        title="Seller Dashboard"
        subtitle={`Last 30 days · ${seller.label}`}
        sellers={sellers}
        activeId={activeId}
        activePath="/dashboard"
      />

      {data.authRevoked && (
        <div className="mb-6 flex items-center justify-between rounded-md bg-[var(--status-critical)]/10 px-4 py-3 text-sm text-[var(--status-critical)]">
          <span>{seller.label} revoked this app&apos;s access in Seller Central. Reconnect to keep seeing their data.</span>
          <a href="/api/oauth/start" className="rounded-md border border-current px-3 py-1 font-medium">
            Reconnect
          </a>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Revenue (30d)" value={formatMoney(revenue30, currency)} />
        <KpiCard label="Orders (30d)" value={orders30.toLocaleString("en-IN")} />
        <KpiCard label="Units sold (30d)" value={units30.toLocaleString("en-IN")} />
        <KpiCard label="Avg order value" value={formatMoney(avgOrderValue, currency)} />
      </div>

      <div className="mb-6">
        <SectionCard title="Sales trend" error={data.sales.error}>
          <SalesChart data={data.sales.data} />
        </SectionCard>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent orders (7d)" error={data.orders.error}>
          <OrdersTable orders={data.orders.data} />
        </SectionCard>

        <SectionCard title="FBA inventory" error={data.inventory.error}>
          <InventoryTable sellerId={seller.id} items={data.inventory.data} />
        </SectionCard>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Returns (30d)" error={data.returns.error}>
          <ReturnsTable returns={data.returns.data} />
        </SectionCard>

        <SectionCard title="Finances (7d)" error={data.finance.error}>
          {data.finance.data && (
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Revenue" value={formatMoney(data.finance.data.revenue, data.finance.data.currency)} />
              <KpiCard label="Fees" value={formatMoney(data.finance.data.fees, data.finance.data.currency)} />
              <KpiCard label="Net" value={formatMoney(data.finance.data.net, data.finance.data.currency)} />
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Account health" error={data.feedback.error}>
          {data.feedback.data?.available ? (
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Positive feedback" value={String(data.feedback.data.positiveCount ?? 0)} />
              <KpiCard label="Neutral feedback" value={String(data.feedback.data.neutralCount ?? 0)} />
              <KpiCard label="Negative feedback" value={String(data.feedback.data.negativeCount ?? 0)} />
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              {data.feedback.data?.message ??
                "Account health metrics aren't exposed to third-party apps via public SP-API. Check Seller Central directly for ODR, late-dispatch rate, and policy compliance."}
            </p>
          )}
        </SectionCard>

        <SectionCard title="Top search terms (Brand Analytics)">
          {brandAnalytics.available ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--gridline)] text-[var(--text-muted)]">
                  <th className="pb-2 font-medium">Rank</th>
                  <th className="pb-2 font-medium">Search term</th>
                  <th className="pb-2 font-medium text-right">Click share</th>
                  <th className="pb-2 font-medium text-right">Conversion share</th>
                </tr>
              </thead>
              <tbody>
                {brandAnalytics.rows.map((row) => (
                  <tr key={row.searchTerm} className="border-b border-[var(--gridline)] last:border-0">
                    <td className="py-2 tabular-nums text-[var(--text-secondary)]">{row.searchFrequencyRank}</td>
                    <td className="py-2 text-[var(--text-primary)]">{row.searchTerm}</td>
                    <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                      {(row.clickShare * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                      {(row.conversionShare * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{brandAnalytics.message}</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
