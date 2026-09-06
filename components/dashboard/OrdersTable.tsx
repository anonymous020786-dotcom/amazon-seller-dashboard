import type { RecentOrder } from "@/lib/sp-api/types";

const STATUS_STYLES: Record<string, string> = {
  shipped: "bg-[var(--status-good)]/10 text-[var(--status-good)]",
  pending: "bg-[var(--status-warning)]/15 text-[var(--status-warning)]",
  cancelled: "bg-[var(--status-critical)]/10 text-[var(--status-critical)]",
  canceled: "bg-[var(--status-critical)]/10 text-[var(--status-critical)]",
  unshipped: "bg-[var(--status-serious)]/10 text-[var(--status-serious)]",
  partially_shipped: "bg-[var(--status-serious)]/10 text-[var(--status-serious)]",
  partialshipped: "bg-[var(--status-serious)]/10 text-[var(--status-serious)]",
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export function OrdersTable({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No orders in this window.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--gridline)] text-[var(--text-muted)]">
            <th className="pb-2 font-medium">Order</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 15).map((o) => (
            <tr key={o.orderId} className="border-b border-[var(--gridline)] last:border-0">
              <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">{o.orderId}</td>
              <td className="py-2 text-[var(--text-secondary)]">
                {new Date(o.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </td>
              <td className="py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[o.status.toLowerCase()] ?? "bg-[var(--gridline)] text-[var(--text-secondary)]"
                  }`}
                >
                  {o.status}
                </span>
              </td>
              <td className="py-2 text-right tabular-nums text-[var(--text-primary)]">
                {formatMoney(o.total, o.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
