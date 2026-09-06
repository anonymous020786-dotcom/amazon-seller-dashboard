import type { InventoryItem } from "@/lib/sp-api/types";
import { NotifyLowStockButton } from "./NotifyLowStockButton";

const LOW_STOCK_THRESHOLD = 10;

export function InventoryTable({ sellerId, items }: { sellerId: string; items: InventoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No FBA inventory found.</p>;
  }

  const sorted = [...items].sort((a, b) => a.fulfillable - b.fulfillable);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--gridline)] text-[var(--text-muted)]">
            <th className="pb-2 font-medium">SKU</th>
            <th className="pb-2 font-medium">ASIN</th>
            <th className="pb-2 font-medium text-right">Fulfillable</th>
            <th className="pb-2 font-medium text-right">Total</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 15).map((item) => {
            const low = item.fulfillable <= LOW_STOCK_THRESHOLD;
            return (
              <tr key={item.sku} className="border-b border-[var(--gridline)] last:border-0">
                <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">{item.sku}</td>
                <td className="py-2 font-mono text-xs text-[var(--text-secondary)]">{item.asin}</td>
                <td
                  className={`py-2 text-right tabular-nums font-medium ${
                    low ? "text-[var(--status-critical)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {item.fulfillable}
                </td>
                <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">{item.totalQuantity}</td>
                <td className="py-2 pl-3">
                  {low && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[var(--status-critical)]/10 px-2 py-0.5 text-xs font-medium text-[var(--status-critical)]">
                        Low stock
                      </span>
                      <NotifyLowStockButton sellerId={sellerId} sku={item.sku} />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
