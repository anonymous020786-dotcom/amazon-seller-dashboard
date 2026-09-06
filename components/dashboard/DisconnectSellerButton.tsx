"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DisconnectSellerButton({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Disconnect this seller? You'll need to re-authorize to reconnect.")) return;
    setPending(true);
    await fetch(`/api/sellers/${sellerId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--status-critical)] transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      {pending ? "Disconnecting..." : "Disconnect"}
    </button>
  );
}
