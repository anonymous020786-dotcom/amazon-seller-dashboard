import { NextResponse } from "next/server";
import { deleteSeller } from "@/lib/sellers/store";
import { invalidate } from "@/lib/cache";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Data Protection Policy: once a seller disconnects, stop holding anything
  // of theirs — remove the stored (encrypted) refresh token and drop any of
  // their cached order/sales/inventory data immediately rather than waiting
  // out the TTL.
  deleteSeller(id);
  invalidate(`${id}:`);
  return NextResponse.json({ ok: true });
}
