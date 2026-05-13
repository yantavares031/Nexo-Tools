function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? "");
}

function getDeskfyStatusCode(message: string): number | null {
  const match = message.match(/\bDeskfy\s+(\d{3})\b/i);
  if (!match) return null;

  const status = Number.parseInt(match[1] ?? "", 10);
  return Number.isFinite(status) ? status : null;
}

type NormalizeDeskfyUserMessageOptions = {
  fallback: string;
};

export function normalizeDeskfyUserMessage(
  err: unknown,
  options: NormalizeDeskfyUserMessageOptions
): string {
  const message = getErrorMessage(err).trim();
  if (!message) return options.fallback;

  const lower = message.toLowerCase();
  const status = getDeskfyStatusCode(message);

  if (lower.includes("chave api deskfy não configurada")) {
    return "A chave da API Deskfy não está configurada. Verifique a aba Integrações.";
  }

  if (lower.includes("identificador da demanda deskfy inválido")) {
    return "Identificador da solicitação Deskfy inválido.";
  }

  if (status === 400) {
    return "Não foi possível consultar a Deskfy por causa de parâmetros inválidos.";
  }

  if (status === 401) {
    return "Não foi possível autenticar na Deskfy. Verifique a chave da API em Integrações.";
  }

  if (status === 404 && lower.includes("task not found")) {
    return "Nenhuma solicitação foi encontrada na Deskfy com o código informado.";
  }

  if (status === 404) {
    return "O recurso solicitado não foi encontrado na Deskfy.";
  }

  if (status !== null && status >= 500) {
    return "Erro de servidor ao consultar a Deskfy. Tente novamente em instantes.";
  }

  if (lower.includes("timeout") || lower.includes("fetch failed") || lower.includes("network")) {
    return "Não foi possível conectar à Deskfy no momento. Tente novamente.";
  }

  return options.fallback;
}

