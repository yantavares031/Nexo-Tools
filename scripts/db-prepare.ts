/**
 * Executa prepare_db() no banco conforme ACTIVE_DRIVER_DB (Postgres ou SQLite).
 * Uso: npm run db:prepare
 */
import "dotenv/config";
import { PrepareRepository } from "@/lib/infra/repositories/prepare.repository";
import { getActiveDbDriver } from "@/lib/infra/db-driver";
import { closePool } from "@/lib/infra/db-pg";

async function main(): Promise<void> {
  const driver = getActiveDbDriver();
  console.log(`[db:prepare] Driver ativo: ${driver}`);
  const prepareRepo = new PrepareRepository();
  await prepareRepo.prepare_db();
  console.log("[db:prepare] Banco preparado com sucesso.");
}

async function run(): Promise<void> {
  let exitCode = 0;
  try {
    await main();
  } catch (err) {
    console.error("[db:prepare] Erro:", err);
    exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch {
      // pool pode não existir (SQLite)
    }
  }
  process.exit(exitCode);
}

void run();
