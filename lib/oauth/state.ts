import { randomBytes } from "crypto";
import { getDb } from "../db/client";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createState(): string {
  const state = randomBytes(24).toString("hex");
  getDb().prepare("INSERT INTO oauth_states (state, created_at) VALUES (?, ?)").run(state, new Date().toISOString());
  return state;
}

export function consumeState(state: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT created_at FROM oauth_states WHERE state = ?").get(state) as
    | { created_at: string }
    | undefined;

  db.prepare("DELETE FROM oauth_states WHERE state = ?").run(state);

  if (!row) return false;
  const age = Date.now() - new Date(row.created_at).getTime();
  return age <= STATE_TTL_MS;
}
