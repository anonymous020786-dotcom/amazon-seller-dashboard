# Amazon SP-API setup (SPN partner / public app)

This dashboard is multi-tenant: as an SPN (Solution Provider Network) partner, you register
**one public SP-API app**, and each client seller authorizes it individually through Amazon's
OAuth consent flow. The app then stores each seller's resulting refresh token (encrypted) and
lets you switch between connected sellers in the dashboard.

Steps 1–2 happen in Amazon's Developer Central / Seller Central and can't be automated from here.

## 1. Register (or locate) your public SP-API app

1. In Seller Central (or the Solution Provider Portal, if your SPN membership routes through
   there), go to **Apps & Services → Develop Apps**.
2. Your app should be type **Public** — this is what enables the OAuth "Authorize" flow so
   *other* sellers can grant your app access, as opposed to a Private app which can only
   self-authorize your own account.
3. On the app's page you'll find two different IDs — don't mix them up:
   - **LWA Client ID / Client Secret** — used for token requests and exchanges.
     → `SP_API_CLIENT_ID` / `SP_API_CLIENT_SECRET`.
   - **Application ID** (looks like `amzn1.sp.solution.xxxxxxxx`) — used in the OAuth
     consent URL sellers are sent to. → `SP_API_APPLICATION_ID`.
4. Configure the app's **OAuth Redirect URI** to point at this app's callback:
   `https://<your-deployed-domain>/api/oauth/callback` (or `http://localhost:3000/api/oauth/callback`
   for local testing, if Amazon's dev tooling allows a localhost redirect for your app).
5. While the app is still in **Draft** (not yet published for other sellers to find), the
   consent URL needs an extra `&version=beta` param — that's what `SP_API_APP_DRAFT=true` adds
   automatically. Set it to `false` once your app is published.

## 1a. Roles to request

Request every non-Restricted role this dashboard calls:

- **Inventory and Order Tracking** (Orders + FBA Inventory)
- **Finance and Accounting** (Finances API)
- **Selling Partner Insights** (best-effort account-health section)
- **Product Listing** (Listings Items API — view/edit your listings; Catalog Items API — product titles/images)
- **Pricing** (Product Pricing API — your price vs. buy box, read-only)
- **Amazon Fulfillment** (FBA Inbound Shipments — read-only in this build)
- **Brand Analytics** (Search Terms report — only produces data if the seller is Brand Registered)
- **Notifications in Seller Central** (App Integrations API — the "Notify seller" low-stock action)

Leave every **Restricted** role unchecked (Direct-to-Consumer Shipping, Tax Invoicing, Tax
Remittance, Professional Services) — none of those are used anywhere in the code. Checking any of
them adds a mandatory third-party Data Security Assessment to your app review, for functionality
you don't need. Double-check this list against Amazon's live role-definitions page (linked from
the registration form) before submitting — role-to-API mapping can change.

## 2. Sandbox vs. production

You currently have **sandbox credentials**. With `SP_API_USE_SANDBOX=true`:
- All SP-API calls route to Amazon's sandbox endpoints.
- Responses are **static mock data** defined by Amazon per operation (not your or your test
  seller's real business data) — see [the sandbox guide](https://developer-docs.amazon.com/sp-api/docs/the-selling-partner-api-sandbox).
- The OAuth authorize flow itself still works the same way in sandbox — you (or a test seller
  account) go through the same consent screen and get a real refresh token, it's just that API
  calls made with that token return sandbox data rather than production data.

Flip `SP_API_USE_SANDBOX=false` once you're ready to test against real seller data.

## 3. Fill in `.env.local`

Copy `.env.example` to `.env.local` and fill in:

- `SP_API_CLIENT_ID`, `SP_API_CLIENT_SECRET`, `SP_API_APPLICATION_ID` — from step 1.
- `SP_API_REGION` — `eu` for India.
- `SP_API_AUTH_HOST` — defaults to `sellercentral.amazon.in`; change if your clients are in a
  different marketplace region.
- `SP_API_APP_DRAFT` — `true` until your app is published.
- `SP_API_USE_SANDBOX` — `true` for now.
- `ENCRYPTION_KEY` — generate with the one-liner in `.env.example`; this encrypts every
  connected seller's refresh token before it's written to `data/app.db`.
- `DASHBOARD_PASSWORD`, `SESSION_SECRET` — gate your team's access to the dashboard itself
  (unrelated to any seller's Amazon credentials).

## 4. Connect a seller

1. Run `npm run dev`, log in with `DASHBOARD_PASSWORD`, and you'll land on **/dashboard/sellers**
   (empty, since no sellers are connected yet).
2. Click **Connect a seller** — this redirects to Amazon's consent screen
   (`/api/oauth/start` → `https://sellercentral.../apps/authorize/consent`).
3. Approve as the seller (use your own seller test account, or a sandbox test account, for now).
4. Amazon redirects back to `/api/oauth/callback`, which exchanges the authorization code for a
   refresh token, looks up a friendly label via `getMarketplaceParticipations`, and stores the
   seller (encrypted token) in `data/app.db`.
5. You're redirected back to `/dashboard/sellers` with the new seller listed — click
   **View dashboard** to see their data.

Repeat for each client seller. The dashboard's header shows a seller switcher once more than
one is connected.

## Compliance & data handling

This is what's actually implemented, matching Amazon's Data Protection Policy baseline for a
non-Restricted-role app:

- **Encryption at rest**: every connected seller's refresh token is encrypted (AES-256-GCM,
  `ENCRYPTION_KEY`) before being written to `data/app.db`. Order/sales/inventory/etc. data itself
  is never written to disk — it lives only in an in-memory cache with a short TTL.
- **Encryption in transit**: use HTTPS for the deployed app and its OAuth redirect URI in
  production (`http://localhost` is fine for local dev only — Amazon's own consent flow talks to
  your redirect URI over the public internet once deployed).
- **Immediate deletion on disconnect**: clicking Disconnect on `/dashboard/sellers` deletes that
  seller's stored token and purges their cached data immediately, rather than waiting for the
  cache TTL to expire.
- **Revoked-access detection**: if a seller revokes the app from Seller Central directly, the
  dashboard detects the resulting `invalid_grant` error on their next data load and shows a
  "Reconnect" banner instead of a generic error.
- **Privacy policy**: `app/privacy/page.tsx` (served at `/privacy`, intentionally left
  unauthenticated) documents what's accessed, how it's stored, and how to request deletion —
  update the contact details there if they change, and use this page's URL for Amazon's "Privacy
  Policy URL" field when you publish the app.
- **Scope discipline**: no Restricted roles requested, so no buyer PII ever passes through this
  app — see the "Roles to request" section above.

## Known limitations

- **Account health** (order defect rate, late-dispatch rate, policy compliance) has no public
  SP-API equivalent — the "Account health" section is a best-effort proxy via the Seller
  Feedback API and may show "unavailable" depending on what your app was authorized for.
- **Returns, Finances, and Brand Analytics** use Amazon's asynchronous **Reports API** — the
  first load after a restart can take up to ~30 seconds per seller while the report generates;
  results are cached afterward (see the TTLs in `lib/sp-api/domains.ts`, `brandAnalytics.ts`).
- **Brand Analytics** only returns data for Brand Registered sellers — everyone else sees a
  graceful "unavailable" message, which is expected, not a bug.
- **Sandbox data is static**, not your test seller's real numbers — don't be surprised if every
  connected sandbox seller shows identical figures; that's Amazon's sandbox behavior, not a bug.
- **Listing edits and shipment reads are likely not meaningfully testable in sandbox** — Amazon's
  sandbox mostly covers GET-style static responses. Testing the price/quantity edit flow for real
  needs production credentials (`SP_API_USE_SANDBOX=false`) against a real listing — start with a
  low-stakes/inactive SKU the first time.
- **Listing writes are eventually consistent** — after saving a price/quantity change, an
  immediate re-fetch may briefly still show the old value while Amazon processes it.
- **Listing price/quantity edits use the standard `purchasable_offer` / `fulfillment_availability`
  attributes** (`lib/sp-api/listings.ts`), which cover most product types. A handful of
  specialized categories use a different attribute schema — if a patch fails for one of those,
  that SKU's product type needs its own attribute path (see the Listings Items API reference for
  that product type).
- **App Integrations notifications are best-effort** — the installed `amazon-sp-api` package only
  defines this API's path/method, not its request body schema (it's a newer, 2024-04-01 API), so
  `lib/sp-api/notifications.ts`'s payload is based on Amazon's docs rather than verified types.
  Verify against the live API reference if it starts failing.
- **Creating new FBA inbound shipments isn't implemented** — the current Fulfillment Inbound API
  version replaced shipment creation with a multi-step Inbound Plan workflow (create plan →
  packing → placement → transportation → confirm); this build only reads existing shipments.
- **Bulk edits via the Feeds API aren't implemented** — direct per-SKU edits through Listings
  Items cover the actual need; Feeds is a lower-value, higher-complexity bulk mechanism.
