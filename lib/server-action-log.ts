import { appLogger } from "@/lib/logger";
import { getAuditLogFields } from "@/lib/logger/audit-context";

/**
 * Remove linhas de stack de node_modules / build para log mais enxuto.
 */
function compactStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const lines = stack
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (l.includes("node_modules")) return false;
      if (l.includes("/.next/")) return false;
      return true;
    });
  return lines.slice(0, 16).join("\n");
}

/**
 * Erros inesperados em Server Actions (stack reduzida, contexto estruturado).
 * Inclui sempre o usuário da sessão quando houver login (auditoria).
 * Servidor apenas — nunca expor ao client.
 */
export async function logServerActionError(
  actionName: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const audit = await getAuditLogFields();
  appLogger.error(
    {
      event: "server_action.error",
      action: actionName,
      errName: err.name,
      errMessage: err.message,
      stack: compactStack(err.stack),
      ...context,
      ...audit,
    },
    `[${actionName}] ${err.message}`
  );
}

/**
 * Falha em caso de uso (repositório, integração, etc.) — para try/catch dentro de use cases.
 * Inclui o usuário da sessão quando existir (mesma requisição).
 */
export async function logUseCaseError(
  useCaseName: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const audit = await getAuditLogFields();
  appLogger.error(
    {
      event: "use_case.error",
      useCase: useCaseName,
      errName: err.name,
      errMessage: err.message,
      stack: compactStack(err.stack),
      ...context,
      ...audit,
    },
    `[use-case:${useCaseName}] ${err.message}`
  );
}

/**
 * Evento de negócio / auditoria (info) em use case ou serviço server-side.
 * Inclui o usuário da sessão quando existir.
 */
export async function logUseCaseInfo(
  useCaseName: string,
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  const audit = await getAuditLogFields();
  appLogger.info(
    { event: "use_case.info", useCase: useCaseName, ...context, ...audit },
    message
  );
}
