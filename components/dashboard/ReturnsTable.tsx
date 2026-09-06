import type { ReturnRecord } from "@/lib/sp-api/types";

export function ReturnsTable({ returns }: { returns: ReturnRecord[] }) {
  if (returns.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No returns in this window.</p>;
  }

  const byReason = new Map<string, number>();
  for (const r of returns) {
    byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + r.quantity);
  }
  const topReasons = [...byReason.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <ul className="mb-4 space-y-1.5">
        {topReasons.map(([reason, qty]) => (
          <li key={reason} className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{reason}</span>
            <span className="tabular-nums font-medium text-[var(--text-primary)]">{qty}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--text-muted)]">{returns.length} return line items in this window</p>
    </div>
  );
}
