import path from "path";
import { getSqliteDbFilePath } from "@/DB/db";

/** Caminho do arquivo SQLite: DATABASE_PATH ou DB/nexo.db (padrão do app). */
export function resolveSqliteDatabasePath(): string {
  const fromEnv = process.env.DATABASE_PATH?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }
  return getSqliteDbFilePath();
}
