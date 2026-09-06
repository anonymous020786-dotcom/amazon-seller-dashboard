"use client";

import { useRouter } from "next/navigation";
import type { Seller } from "@/lib/sellers/store";

export function SellerSwitcher({ sellers, activeId }: { sellers: Seller[]; activeId: string }) {
  const router = useRouter();

  return (
    <select
      value={activeId}
      onChange={(e) => router.push(`/dashboard?seller=${e.target.value}`)}
      className="rounded-md border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm text-[var(--text-primary)]"
    >
      {sellers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
