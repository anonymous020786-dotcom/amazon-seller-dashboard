"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({ error: "Login failed" }));
      setError(body.error ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Seller Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Enter the dashboard password to continue.</p>

        <label className="mt-6 block text-sm font-medium text-[var(--text-secondary)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--series-1)]"
        />

        {error && <p className="mt-3 text-sm text-[var(--status-critical)]">{error}</p>}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="mt-6 w-full rounded-md bg-[var(--series-1)] py-2 font-medium text-white transition-opacity disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
