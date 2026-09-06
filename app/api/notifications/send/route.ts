import { NextResponse } from "next/server";
import { getSeller } from "@/lib/sellers/store";
import { sendLowStockNotification } from "@/lib/sp-api/notifications";

export async function POST(request: Request) {
  const { sellerId, sku } = await request.json().catch(() => ({}));

  if (typeof sellerId !== "string" || typeof sku !== "string") {
    return NextResponse.json({ ok: false, error: "sellerId and sku are required" }, { status: 400 });
  }

  const seller = getSeller(sellerId);
  if (!seller) {
    return NextResponse.json({ ok: false, error: "Unknown seller" }, { status: 404 });
  }

  try {
    await sendLowStockNotification(
      { sellerId: seller.id, refreshToken: seller.refreshToken, marketplaceId: seller.marketplaceId },
      sku
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to send notification" },
      { status: 500 }
    );
  }
}
