"use client";

import { useState } from "react";
import type { ListingSummary } from "@/lib/sp-api/listings";
import type { OfferSummary } from "@/lib/sp-api/pricing";
import { ListingEditForm } from "./ListingEditForm";

export interface ListingRow extends ListingSummary {
  offer: OfferSummary | null;
}

function formatMoney(amount: number | null, currency: string) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export function ListingsTable({ sellerId, listings }: { sellerId: string; listings: ListingRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (listings.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No listings found for this seller.</p>;
  }

  return (
    <div className="space-y-2">
      {listings.map((item) => {
        const losingBuyBox =
          item.offer && item.offer.buyBoxPrice != null && item.offer.yourPrice != null && !item.offer.isFeaturedOffer;
        return (
          <div key={item.sku} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-3">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <div className="h-10 w-10 rounded bg-[var(--gridline)]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  {item.sku} · {item.asin}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                  {formatMoney(item.price, item.currency)}
                </p>
                {losingBuyBox && (
                  <p className="text-xs text-[var(--status-warning)]">
                    Buy box: {formatMoney(item.offer!.buyBoxPrice, item.offer!.currency)}
                  </p>
                )}
              </div>
              <div className="w-16 text-right text-sm tabular-nums text-[var(--text-secondary)]">
                {item.quantity ?? "—"}
              </div>
              <span className="rounded-full bg-[var(--gridline)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                {item.status}
              </span>
              <button
                onClick={() => setExpanded(expanded === item.sku ? null : item.sku)}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {expanded === item.sku ? "Close" : "Edit"}
              </button>
            </div>

            {expanded === item.sku && (
              <ListingEditForm
                sellerId={sellerId}
                sku={item.sku}
                productType={item.productType}
                currentPrice={item.price}
                currentQuantity={item.quantity}
                currency={item.currency}
                onClose={() => setExpanded(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
