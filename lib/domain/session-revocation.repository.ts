export interface ISessionRevocationRepository {
  /** Sessões criadas até este instante (epoch ms) não valem mais; `null` se nunca houve revogação. */
  getRevokedAt(userId: string): Promise<number | null>;
  revoke(userId: string, revokedAt: number): Promise<void>;
}
