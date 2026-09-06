import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSpApiClient } from "@/lib/sp-api/client";
import { listSellers, getSeller } from "@/lib/sellers/store";

export async function GET(request: NextRequest) {
  const requestedId = request.nextUrl.searchParams.get("seller");
  const sellers = listSellers();
  const targetId = requestedId ?? sellers[0]?.id;

  if (!targetId) {
    return NextResponse.json({ ok: false, error: "No sellers connected yet. Visit /dashboard/sellers first." }, { status: 400 });
  }

  const seller = getSeller(targetId);
  if (!seller) {
    return NextResponse.json({ ok: false, error: `Unknown seller: ${targetId}` }, { status: 404 });
  }

  try {
    const client = getSpApiClient(seller.refreshToken);
    const res = await client.callAPI({
      operation: "getMarketplaceParticipations",
      endpoint: "sellers",
    });
    return NextResponse.json({ ok: true, seller: seller.label, marketplaceCount: res.length });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
