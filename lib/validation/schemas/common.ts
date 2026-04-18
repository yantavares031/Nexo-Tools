import { z } from "zod";

/** IDs UUID usados no banco (demandas, usuários, etc.). */
export const entityIdSchema = z.string().trim().uuid("Identificador inválido.");

export const paginationPageSchema = z.coerce.number().int().min(1).max(50_000);

export const paginationLimitSchema = z.coerce.number().int().min(1).max(200);

export function parseEntityId(id: string): { ok: true; id: string } | { ok: false; error: string } {
  const r = entityIdSchema.safeParse(id);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Identificador inválido." };
  return { ok: true, id: r.data };
}

/**
 * ID na tabela `users`: seeds e novos cadastros usam UUID; registros antigos podem usar timestamp numérico (`Date.now()`).
 */
export const userRecordIdSchema = z
  .string()
  .trim()
  .min(1, "Identificador inválido.")
  .max(128);

export function parseUserRecordId(
  id: string
): { ok: true; id: string } | { ok: false; error: string } {
  const r = userRecordIdSchema.safeParse(id);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Identificador inválido." };
  return { ok: true, id: r.data };
}
