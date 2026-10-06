import type { ISessionRevocationRepository } from "@/lib/domain/session-revocation.repository";
import { getPool } from "@/lib/infra/db-pg";

export class SessionRevocationPostgresRepository implements ISessionRevocationRepository {
  async getRevokedAt(userId: string): Promise<number | null> {
    const pool = getPool();
    const result = await pool.query("SELECT revoked_at FROM user_session_revocations WHERE user_id = $1", [userId]);
    const value = (result.rows[0] as { revoked_at?: unknown } | undefined)?.revoked_at;
    return value == null ? null : Number(value);
  }

  async revoke(userId: string, revokedAt: number): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO user_session_revocations (user_id, revoked_at)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET revoked_at = EXCLUDED.revoked_at`,
      [userId, revokedAt]
    );
  }
}
