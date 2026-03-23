/**
 * Aplica o schema PostgreSQL (via prepare) e insere boards Deskfy padrão se a tabela estiver vazia.
 * Requer DATABASE_URL no .env.
 * Uso: ACTIVE_DRIVER_DB=POSTGRE npm run db:init-postgres
 *
 * Para só o schema base: npm run db:prepare (com ACTIVE_DRIVER_DB=POSTGRE).
 */
import "dotenv/config";
import { randomUUID } from "crypto";
import { PreparePostgresRepository } from "@/lib/infra/repositories/postgres/prepare-postgres.repository";
import { getPool, closePool } from "@/lib/infra/db-pg";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL é obrigatória. Defina no .env antes de rodar."
    );
  }

  const DEFAULT_BOARDS = [
    "AGÊNCIA | MALLMANN",
    "AGÊNCIA | LA MARKA",
    "AGÊNCIA | CLARA",
    "Mídia (TV, RÁDIO, OUTDOOR, SPOT)",
  ];

  await new PreparePostgresRepository().prepare_db();
  const pool = getPool();
  const countResult = await pool.query(
    "SELECT COUNT(*)::int as c FROM deskfy_import_boards"
  );
  if (countResult.rows[0]?.c === 0) {
    for (let i = 0; i < DEFAULT_BOARDS.length; i++) {
      await pool.query(
        "INSERT INTO deskfy_import_boards (id, nome) VALUES ($1, $2)",
        [randomUUID(), DEFAULT_BOARDS[i]]
      );
    }
    console.log("Schema PostgreSQL aplicado. Boards padrão inseridos.");
  } else {
    console.log("Schema PostgreSQL aplicado com sucesso.");
  }
}

async function run(): Promise<void> {
  let exitCode = 0;
  try {
    await main();
  } catch (err) {
    console.error("Erro ao aplicar schema:", err);
    exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch {
      // ignora
    }
  }
  process.exit(exitCode);
}

void run();
