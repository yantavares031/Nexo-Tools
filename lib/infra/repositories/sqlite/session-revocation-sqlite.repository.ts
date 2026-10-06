import type { ISessionRevocationRepository } from "@/lib/domain/session-revocation.repository";
import { getDb } from "@/DB/db";

export class SessionRevocationSqliteRepository implements ISessionRevocationRepository {
  async getRevokedAt(userId: string): Promise<number | null> {
    const db = getDb();
    const row = db
      .prepare("SELECT revoked_at FROM user_session_revocations WHERE user_id = ?")
      .get(userId) as { revoked_at?: unknown } | undefined;
    return row?.revoked_at == null ? null : Number(row.revoked_at);
  }

  async revoke(userId: string, revokedAt: number): Promise<void> {
    const db = getDb();
    db.prepare(
      `INSERT INTO user_session_revocations (user_id, revoked_at)
       VALUES (?, ?)
       ON CONFLICT (user_id) DO UPDATE SET revoked_at = excluded.revoked_at`
    ).run(userId, revokedAt);
  }
}
