# Amazon Seller Dashboard

A standalone Next.js dashboard for an SPN (Solution Provider Network) partner: client sellers
authorize your app via Amazon's OAuth flow, and the dashboard shows and manages each connected
seller's orders, sales, inventory, listings, shipments, and finances through the official Selling
Partner API (SP-API). Covers every non-Restricted-role part of that surface — see SETUP.md for
what's deferred to a later, Restricted-role phase.

This project is fully independent of any other app on this machine: its own repo, its own
dependencies, no shared database or account.

## Setup

1. `npm install` (already done if you just cloned this).
2. Follow **[SETUP.md](./SETUP.md)** to register/locate your public SP-API app and get your
   credentials — this part happens in your Amazon account and can't be automated.
3. Copy `.env.example` to `.env.local` and fill in the values.
4. `npm run dev`, open [http://localhost:3000](http://localhost:3000), and connect your first
   seller from **/dashboard/sellers**.

## What's in the dashboard

**Overview** (`/dashboard`)
- **Sales trend** — daily revenue over the last 30 days (Sales API).
- **Recent orders** — last 7 days of orders (Orders API).
- **FBA inventory** — fulfillable stock per SKU, with low-stock flags and a manual "Notify
  seller" action that posts an alert into their Seller Central (FBA Inventory + App Integrations APIs).
- **Returns** — return volume by reason over 30 days (Reports API).
- **Finances** — revenue/fees/net for the last 7 days (Finances API).
- **Account health** — best-effort via the Seller Feedback API; full ODR/late-dispatch
  metrics aren't exposed by public SP-API.
- **Top search terms** — Brand Analytics report; only populated for Brand Registered sellers.

**Listings** (`/dashboard/listings`)
- Every listing with title/image (Catalog Items), current price and buy-box context (Product
  Pricing), quantity, and status (Listings Items). Each row expands into an editable form that
  can **update price and quantity directly on Amazon** — with an explicit before/after diff and
  confirmation step before submitting the write.

**Shipments** (`/dashboard/shipments`)
- Read-only list of FBA inbound shipments and their status; drill into a shipment for its
  per-SKU shipped/received quantities.

Data is cached in-memory per data domain (5 minutes to 24 hours depending on how
expensive/rate-limited/volatile the underlying API is) — use the **Sync now** button on the
dashboard to force a refresh. See `SETUP.md`'s Known limitations for what's deferred (bulk Feeds
edits, creating new shipments, and anything needing a Restricted role).

## Project structure

- `lib/sp-api/client.ts` — per-seller SP-API client (`getSpApiClient(refreshToken)`) plus a
  grantless client for OAuth code exchange.
- `lib/sp-api/domains.ts`, `listings.ts`, `pricing.ts`, `catalog.ts`, `shipments.ts`,
  `brandAnalytics.ts`, `notifications.ts` — one module per API domain, each function taking the
  shared `SellerContext` and using `lib/cache.ts`'s TTL cache. `domains.ts` also defines and
  exports `SellerContext`.
- `lib/sp-api/errors.ts` — detects a revoked/invalid refresh token (`invalid_grant` etc.) so the
  UI can show "Reconnect" instead of a generic error.
- `lib/sellers/store.ts` — CRUD for connected sellers (`data/app.db`, refresh tokens encrypted
  via `lib/crypto.ts`); `lib/sellers/resolve.ts` — resolves the active seller from `?seller=`,
  shared by every seller-scoped page.
- `lib/oauth/state.ts` — CSRF state tokens for the OAuth authorize flow.
- `lib/auth/` — password-gate session signing for the internal dashboard (unrelated to seller OAuth).
- `lib/cache.ts` — the in-memory TTL cache, keyed per seller.
- `proxy.ts` — Next.js 16's Proxy (formerly Middleware) file; gates every route except `/login`,
  `/privacy`, and `/api/oauth/callback` (Amazon's redirect must reach that one unauthenticated).
- `app/api/oauth/` — `start` (redirect to Amazon's consent screen) and `callback` (exchange code,
  store the seller). `app/api/listings/update/` and `app/api/notifications/send/` — the two write paths.
- `app/dashboard/sellers/` — connect/disconnect/list seller accounts.
- `app/dashboard/`, `app/dashboard/listings/`, `app/dashboard/shipments/` — the three seller-scoped
  pages (`?seller=<id>`), sharing `components/dashboard/DashboardHeader.tsx` for nav.
- `components/dashboard/`, `components/charts/` — UI.

## Notes on Next.js 16

This scaffold is on Next.js 16, which has a few breaking changes worth knowing before editing:

- `middleware.ts` is deprecated in favor of `proxy.ts` (exporting a `proxy` function) — see
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- Proxy now defaults to the Node.js runtime (no more Edge-runtime constraints on it).
- `cookies()` in Route Handlers is asynchronous (`await cookies()`).

Check `node_modules/next/dist/docs/` for anything else before assuming APIs match older
Next.js versions you may be used to.
