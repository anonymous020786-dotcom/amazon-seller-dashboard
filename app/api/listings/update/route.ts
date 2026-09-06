import { NextResponse } from "next/server";
import { getSeller } from "@/lib/sellers/store";
import { updateListingPrice, updateListingQuantity } from "@/lib/sp-api/listings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { sellerId, sku, productType, price, currency, quantity } = body as {
    sellerId?: string;
    sku?: string;
    productType?: string;
    price?: number;
    currency?: string;
    quantity?: number;
  };

  if (typeof sellerId !== "string" || typeof sku !== "string" || typeof productType !== "string") {
    return NextResponse.json({ ok: false, error: "sellerId, sku, and productType are required" }, { status: 400 });
  }
  if (price !== undefined && (typeof price !== "number" || !(price > 0))) {
    return NextResponse.json({ ok: false, error: "price must be a positive number" }, { status: 400 });
  }
  if (price !== undefined && typeof currency !== "string") {
    return NextResponse.json({ ok: false, error: "currency is required when updating price" }, { status: 400 });
  }
  if (quantity !== undefined && (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0)) {
    return NextResponse.json({ ok: false, error: "quantity must be a non-negative integer" }, { status: 400 });
  }

  const seller = getSeller(sellerId);
  if (!seller) {
    return NextResponse.json({ ok: false, error: "Unknown seller" }, { status: 404 });
  }
  const sellerContext = { sellerId: seller.id, refreshToken: seller.refreshToken, marketplaceId: seller.marketplaceId };

  try {
    if (price !== undefined) {
      await updateListingPrice(sellerContext, sku, productType, price, currency as string);
    }
    if (quantity !== undefined) {
      await updateListingQuantity(sellerContext, sku, productType, quantity);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
