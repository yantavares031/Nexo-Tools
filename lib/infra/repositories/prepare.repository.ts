import { isPostgres } from "@/lib/infra/db-driver";
import type { IPrepareRepository } from "@/lib/domain/prepare.repository";
import { PreparePostgresRepository } from "./postgres/prepare-postgres.repository";
import { PrepareSqliteRepository } from "./sqlite/prepare-sqlite.repository";

/** Escolhe Postgres ou SQLite conforme `ACTIVE_DRIVER_DB`. */
export class PrepareRepository implements IPrepareRepository {
  private readonly impl: IPrepareRepository;

  constructor() {
    this.impl = isPostgres()
      ? new PreparePostgresRepository()
      : new PrepareSqliteRepository();
  }

  prepare_db(): Promise<void> {
    return this.impl.prepare_db();
  }
}
