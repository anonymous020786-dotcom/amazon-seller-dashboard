"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ListingEditForm({
  sellerId,
  sku,
  productType,
  currentPrice,
  currentQuantity,
  currency,
  onClose,
}: {
  sellerId: string;
  sku: string;
  productType: string;
  currentPrice: number | null;
  currentQuantity: number | null;
  currency: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(currentPrice?.toString() ?? "");
  const [quantity, setQuantity] = useState(currentQuantity?.toString() ?? "");
  const [step, setStep] = useState<"edit" | "confirm" | "saving" | "error">("edit");
  const [error, setError] = useState<string | null>(null);

  const priceChanged = price !== "" && Number(price) !== currentPrice;
  const quantityChanged = quantity !== "" && Number(quantity) !== currentQuantity;
  const hasChanges = priceChanged || quantityChanged;

  async function handleSave() {
    setStep("saving");
    setError(null);
    const res = await fetch("/api/listings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId,
        sku,
        productType,
        price: priceChanged ? Number(price) : undefined,
        currency,
        quantity: quantityChanged ? Number(quantity) : undefined,
      }),
    });

    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const body = await res.json().catch(() => ({ error: "Update failed" }));
      setError(body.error ?? "Update failed");
      setStep("error");
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      {step === "edit" || step === "error" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)]">Price ({currency})</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text-primary)]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)]">Quantity</span>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--text-primary)]"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-sm text-[var(--status-critical)]">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setStep("confirm")}
              disabled={!hasChanges}
              className="rounded-md bg-[var(--series-1)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Review changes
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </>
      ) : step === "confirm" ? (
        <>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            This changes {sku}&apos;s live listing on Amazon:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
            {priceChanged && (
              <li>
                Price: <span className="tabular-nums">{currentPrice ?? "—"}</span> →{" "}
                <span className="font-medium text-[var(--text-primary)] tabular-nums">{price}</span> {currency}
              </li>
            )}
            {quantityChanged && (
              <li>
                Quantity: <span className="tabular-nums">{currentQuantity ?? "—"}</span> →{" "}
                <span className="font-medium text-[var(--text-primary)] tabular-nums">{quantity}</span>
              </li>
            )}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-md bg-[var(--status-critical)] px-3 py-1.5 text-sm font-medium text-white"
            >
              Yes, save to Amazon
            </button>
            <button
              onClick={() => setStep("edit")}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)]"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Saving…</p>
      )}
    </div>
  );
}
