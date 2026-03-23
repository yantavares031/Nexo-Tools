/**
 * Driver de banco ativo (Factory / Strategy).
 * Define qual implementação de repositório será usada com base em ACTIVE_DRIVER_DB.
 */
export type ActiveDbDriver = "POSTGRE" | "SQLITE";

const VALID_DRIVERS: ActiveDbDriver[] = ["POSTGRE", "SQLITE"];

function normalizeDriver(): ActiveDbDriver {
  const raw = process.env.ACTIVE_DRIVER_DB?.trim().toUpperCase();
  if (raw === "POSTGRE" || raw === "POSTGRES") return "POSTGRE";
  if (raw === "SQLITE") return "SQLITE";
  return "SQLITE";
}

let _driver: ActiveDbDriver | null = null;

/** Retorna o driver ativo (POSTGRE ou SQLITE). Default: SQLITE. */
export function getActiveDbDriver(): ActiveDbDriver {
  if (_driver === null) {
    _driver = normalizeDriver();
  }
  return _driver;
}

/** True quando ACTIVE_DRIVER_DB=POSTGRE (ou POSTGRES). */
export function isPostgres(): boolean {
  return getActiveDbDriver() === "POSTGRE";
}

/** True quando ACTIVE_DRIVER_DB=SQLITE. */
export function isSqlite(): boolean {
  return getActiveDbDriver() === "SQLITE";
}
