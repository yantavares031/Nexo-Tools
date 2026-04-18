/**
 * Observabilidade mínima em Server Actions (servidor apenas — nunca expor ao client).
 */
export function logServerActionError(
  actionName: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(
    `[ServerAction:${actionName}]`,
    err.message,
    context && Object.keys(context).length > 0 ? context : undefined,
    err.stack
  );
}
