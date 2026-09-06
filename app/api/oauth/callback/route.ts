import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { consumeState } from "@/lib/oauth/state";
import { getGrantlessClient, getSpApiClient } from "@/lib/sp-api/client";
import { saveSeller } from "@/lib/sellers/store";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state");
  const sellingPartnerId = searchParams.get("selling_partner_id");
  const authCode = searchParams.get("spapi_oauth_code");

  if (!state || !sellingPartnerId || !authCode || !consumeState(state)) {
    return NextResponse.json({ ok: false, error: "Invalid or expired authorization request" }, { status: 400 });
  }

  try {
    const exchange = await getGrantlessClient().exchange(authCode);
    const refreshToken = exchange.refresh_token;

    let marketplaceId = "A21TJRUUN4KGV"; // fall back to India if lookup fails
    let label = sellingPartnerId;
    try {
      const client = getSpApiClient(refreshToken);
      const participations = await client.callAPI({
        operation: "getMarketplaceParticipations",
        endpoint: "sellers",
      });
      const first = participations[0];
      if (first) {
        marketplaceId = first.marketplace.id;
        label = `${first.marketplace.name} (${sellingPartnerId})`;
      }
    } catch {
      // Sandbox or a not-yet-fully-provisioned app may reject this call; keep the fallback label.
    }

    saveSeller({ id: sellingPartnerId, label, marketplaceId, refreshToken });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Token exchange failed" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(new URL(`/dashboard/sellers?connected=${sellingPartnerId}`, request.url));
}
