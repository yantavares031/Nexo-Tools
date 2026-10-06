import type { ISessionRevocationRepository } from "@/lib/domain/session-revocation.repository";
import { getSessionRevocationRepository } from "@/lib/infra/repositories";
import { appLogger } from "@/lib/logger";

const globalCache = globalThis as typeof globalThis & {
  __nexoSessionRevocations?: Map<string, number | null>;
};

/**
 * `getSession` roda várias vezes por requisição; o cache evita ir ao banco em todas.
 * Seguro porque o Next roda em um único processo (ecosystem/Dockerfile): toda revogação passa por aqui.
 */
class CachedSessionRevocationRepository implements ISessionRevocationRepository {
  private readonly cache = (globalCache.__nexoSessionRevocations ??= new Map());

  constructor(private readonly inner: ISessionRevocationRepository) {}

  async getRevokedAt(userId: string): Promise<number | null> {
    if (this.cache.has(userId)) return this.cache.get(userId) ?? null;
    try {
      const revokedAt = await this.inner.getRevokedAt(userId);
      this.cache.set(userId, revokedAt);
      return revokedAt;
    } catch (error) {
      // Sem a tabela (migração pendente) o login continua funcionando; só a revogação fica inativa.
      appLogger.warn({ event: "session.revocation.read_failed", userId, err: error }, "Falha ao ler revogação de sessão");
      return null;
    }
  }

  async revoke(userId: string, revokedAt: number): Promise<void> {
    await this.inner.revoke(userId, revokedAt);
    this.cache.set(userId, revokedAt);
  }
}

export function getCachedSessionRevocationRepository(): ISessionRevocationRepository {
  return new CachedSessionRevocationRepository(getSessionRevocationRepository());
}
