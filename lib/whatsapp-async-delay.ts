/** Colunas `async_msg_delay_*` vindas do SQLite/Postgres. */

export function parseStoredDelaySeconds(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.trunc(value));
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}
