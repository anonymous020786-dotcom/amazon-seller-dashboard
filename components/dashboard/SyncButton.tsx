"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    await fetch("/api/sync", { method: "POST" });
    router.refresh();
    setSyncing(false);
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
    >
      {syncing ? "Syncing..." : "Sync now"}
    </button>
  );
}
