import type { ZodError } from "zod";

/** Primeira mensagem amigável para retorno `{ error }` da action (sem stack). */
export function zodErrorToActionMessage(err: ZodError): string {
  const first = err.issues[0];
  return first?.message ?? "Dados inválidos.";
}
