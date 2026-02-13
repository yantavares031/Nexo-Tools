/**
 * Atualiza o campo mes de todas as demandas para 02/2026.
 * Formato no banco: YYYY-MM (ex.: 2026-02).
 *
 * Executar: npx tsx DB/update-demandas-mes.ts
 */
import { getDb, closeDb } from "./db";

const MES_ANO = "2026-02"; // 02/2026

function main() {
  const database = getDb();
  const stmt = database.prepare("UPDATE demandas SET mes = ?");
  const result = stmt.run(MES_ANO);
  console.log(`Demandas atualizadas: ${result.changes}. Campo mes definido para ${MES_ANO} (02/2026).`);
  closeDb();
}

main();
