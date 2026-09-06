"use client";

import { useState } from "react";

export function NotifyLowStockButton({ sellerId, sku }: { sellerId: string; sku: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setState("sending");
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, sku }),
    });
    setState(res.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return <span className="text-xs font-medium text-[var(--status-good)]">Notified</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "sending"}
      className="rounded-full border border-[var(--status-critical)]/40 px-2 py-0.5 text-xs font-medium text-[var(--status-critical)] hover:bg-[var(--status-critical)]/10 disabled:opacity-50"
    >
      {state === "sending" ? "Sending..." : state === "error" ? "Retry notify" : "Notify seller"}
    </button>
  );
}
