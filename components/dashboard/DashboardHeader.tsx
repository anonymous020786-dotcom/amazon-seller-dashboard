import Link from "next/link";
import type { Seller } from "@/lib/sellers/store";
import { SellerSwitcher } from "./SellerSwitcher";
import { SyncButton } from "./SyncButton";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/listings", label: "Listings" },
  { href: "/dashboard/shipments", label: "Shipments" },
];

export function DashboardHeader({
  title,
  subtitle,
  sellers,
  activeId,
  activePath,
}: {
  title: string;
  subtitle: string;
  sellers: Seller[];
  activeId: string;
  activePath: string;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {sellers.length > 1 && <SellerSwitcher sellers={sellers} activeId={activeId} />}
          <Link
            href="/dashboard/sellers"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Manage sellers
          </Link>
          <SyncButton />
          <LogoutButton />
        </div>
      </div>
      <nav className="mt-4 flex gap-1 border-b border-[var(--border)]">
        {NAV.map((item) => {
          const isActive = item.href === activePath;
          return (
            <Link
              key={item.href}
              href={`${item.href}?seller=${activeId}`}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                isActive
                  ? "border-[var(--series-1)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
