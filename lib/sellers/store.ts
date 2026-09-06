import { getDb } from "../db/client";
import { encrypt, decrypt } from "../crypto";

export interface Seller {
  id: string;
  label: string;
  marketplaceId: string;
  connectedAt: string;
}

export interface SellerWithToken extends Seller {
  refreshToken: string;
}

interface SellerRow {
  id: string;
  label: string;
  marketplace_id: string;
  refresh_token_encrypted: string;
  connected_at: string;
}

function toSeller(row: SellerRow): Seller {
  return {
    id: row.id,
    label: row.label,
    marketplaceId: row.marketplace_id,
    connectedAt: row.connected_at,
  };
}

export function listSellers(): Seller[] {
  const rows = getDb().prepare("SELECT * FROM sellers ORDER BY connected_at DESC").all() as unknown as SellerRow[];
  return rows.map(toSeller);
}

export function getSeller(id: string): SellerWithToken | null {
  const row = getDb().prepare("SELECT * FROM sellers WHERE id = ?").get(id) as SellerRow | undefined;
  if (!row) return null;
  return { ...toSeller(row), refreshToken: decrypt(row.refresh_token_encrypted) };
}

export function saveSeller(input: {
  id: string;
  label: string;
  marketplaceId: string;
  refreshToken: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO sellers (id, label, marketplace_id, refresh_token_encrypted, connected_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         label = excluded.label,
         marketplace_id = excluded.marketplace_id,
         refresh_token_encrypted = excluded.refresh_token_encrypted`
    )
    .run(input.id, input.label, input.marketplaceId, encrypt(input.refreshToken), new Date().toISOString());
}

export function deleteSeller(id: string): void {
  getDb().prepare("DELETE FROM sellers WHERE id = ?").run(id);
}
