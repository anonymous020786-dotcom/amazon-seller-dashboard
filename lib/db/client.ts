import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });

  db = new DatabaseSync(join(dataDir, "app.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      marketplace_id TEXT NOT NULL,
      refresh_token_encrypted TEXT NOT NULL,
      connected_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS oauth_states (
      state TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );
  `);

  return db;
}
