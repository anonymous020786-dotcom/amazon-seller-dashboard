export const metadata = {
  title: "Privacy Policy — Seller Dashboard",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-[var(--text-primary)]">
      <h1 className="text-2xl font-semibold">Privacy policy</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Last updated 5 September 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">What this application is</h2>
          <p>
            This Seller Dashboard is operated by Zestcommerce as a Solution Provider Network (SPN) partner
            application. Amazon sellers who work with Zestcommerce connect their Amazon Seller Central account to
            this application through Amazon&apos;s standard Selling Partner API (SP-API) OAuth authorization flow.
            Sellers never share their Amazon password with us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">What we access</h2>
          <p>Once a seller authorizes the application, we access the following, scoped strictly to that seller&apos;s own account:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Order history and order status (Orders API)</li>
            <li>Sales, revenue, and units-sold trends (Sales API)</li>
            <li>FBA inventory levels per SKU (FBA Inventory API)</li>
            <li>Return volume and reasons (Reports API)</li>
            <li>Revenue, fee, and net-proceeds summaries (Finances API)</li>
            <li>Seller performance signals, where available (Selling Partner Insights)</li>
            <li>Product listing details, images, and current price/quantity (Listings Items and Catalog Items APIs)</li>
            <li>Buy-box and competitive pricing context for the seller&apos;s own listings (Product Pricing API)</li>
            <li>FBA inbound shipment status and contents (Fulfillment Inbound API, read-only)</li>
            <li>Search-term performance, for Brand Registered sellers (Brand Analytics reports)</li>
          </ul>
          <p className="mt-2">
            We do not request access to buyer personal information, and do not generate shipping labels, tax
            documents, or move funds on a seller&apos;s behalf.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">What we can change on your behalf</h2>
          <p>
            The dashboard&apos;s Listings page lets a connected seller (or Zestcommerce staff acting for them) update
            that listing&apos;s <strong>price</strong> and <strong>quantity</strong> directly on Amazon, via the
            Listings Items API. Every change is shown as an explicit before/after diff and requires a separate
            confirmation step before it&apos;s sent to Amazon. We can also post a notification into the seller&apos;s
            own Seller Central (e.g. a low-stock alert) via the App Integrations API. No other write actions are
            performed — we never create, cancel, or modify orders, shipments, or listings beyond price and quantity.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">How it&apos;s stored</h2>
          <p>
            Each seller&apos;s OAuth refresh token is encrypted at rest (AES-256-GCM) before being stored. Everything
            else fetched from SP-API — orders, sales, inventory, listings, pricing, shipments, returns, and finance
            data — is held only in server memory for a short time (minutes to a day, depending on how often that
            data type changes) to avoid re-fetching on every page load, and is never written to disk or shared with
            any third party.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">Retention and deletion</h2>
          <p>
            A seller&apos;s stored token and cached data are retained only for as long as the connection is active.
            A seller can end the connection at any time — either from this dashboard&apos;s connected-sellers page,
            or by revoking the application&apos;s access directly in Seller Central under Manage Your Apps.
            Disconnecting immediately deletes the stored refresh token and clears any cached data for that seller.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">Contact</h2>
          <p>
            For questions about this policy or to request that your data be disconnected and deleted, contact{" "}
            <a href="mailto:contact@zestcommerce.in" className="text-[var(--series-1)] underline">
              contact@zestcommerce.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
