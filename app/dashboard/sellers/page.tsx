import Link from "next/link";
import { listSellers } from "@/lib/sellers/store";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { DisconnectSellerButton } from "@/components/dashboard/DisconnectSellerButton";

export const dynamic = "force-dynamic";

export default async function SellersPage(props: PageProps<"/dashboard/sellers">) {
  const searchParams = await props.searchParams;
  const connected = typeof searchParams.connected === "string" ? searchParams.connected : undefined;
  const sellers = listSellers();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Connected sellers</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage the seller accounts authorized to this app.</p>
        </div>
        <LogoutButton />
      </header>

      {connected && (
        <p className="mb-6 rounded-md bg-[var(--status-good)]/10 px-3 py-2 text-sm text-[var(--status-good)]">
          Seller {connected} connected successfully.
        </p>
      )}

      <a
        href="/api/oauth/start"
        className="mb-6 inline-block rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white"
      >
        Connect a seller
      </a>

      {sellers.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No sellers connected yet. Click &quot;Connect a seller&quot; to start the Amazon authorization flow.
        </p>
      ) : (
        <ul className="space-y-3">
          {sellers.map((seller) => (
            <li
              key={seller.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">{seller.label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {seller.id} · marketplace {seller.marketplaceId} · connected{" "}
                  {new Date(seller.connectedAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard?seller=${seller.id}`}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  View dashboard
                </Link>
                <DisconnectSellerButton sellerId={seller.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-[var(--text-muted)]">
        <Link href="/privacy" className="underline hover:text-[var(--text-primary)]">
          Privacy policy
        </Link>{" "}
        — what we access on a connected seller&apos;s behalf and how it&apos;s stored.
      </p>
    </div>
  );
}
