/** Erros comuns do Nodemailer / SMTP. */
export type SmtpSendError = Error & {
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
};

export function isSmtpBadCredentialsError(err: unknown): boolean {
  const e = err as SmtpSendError;
  const blob = [e?.message, e?.response, String(e?.responseCode ?? "")]
    .filter(Boolean)
    .join(" ");
  return /535|5\.7\.8|Invalid login|BadCredentials|authentication failed/i.test(blob);
}

/** Mensagem para exibir ao usuário (toast/UI). */
export function formatSmtpErrorForUser(err: unknown): string {
  if (isSmtpBadCredentialsError(err)) {
    return (
      "Gmail recusou usuário ou senha no SMTP. A senha da conta (ou a do login do NEXO) não serve aqui: " +
      "é obrigatório criar uma Senha de app de 16 letras (sem espaços), com verificação em duas etapas ativa na conta Google. " +
      "Ajuda: https://support.google.com/accounts/answer/185833"
    );
  }
  const e = err as Error;
  return e?.message && e.message !== "[object Object]" ? e.message : "Falha ao enviar e-mail SMTP.";
}

/** Log detalhado no terminal (servidor). */
export function logSmtpFailureToConsole(
  err: unknown,
  context: { phase: "sendMail" | "verify"; to?: string }
): void {
  const e = err as SmtpSendError;
  const lines = [
    "[SMTP] ❌ Falha",
    `  fase=${context.phase}`,
    ...(context.to ? [`  destino=${context.to}`] : []),
    `  message=${e?.message ?? String(err)}`,
  ];
  if (e?.code) lines.push(`  code=${e.code}`);
  if (e?.command) lines.push(`  command=${e.command}`);
  if (e?.responseCode != null) lines.push(`  responseCode=${e.responseCode}`);
  if (e?.response) {
    const rsp = String(e.response).trim().replace(/\s+/g, " ");
    lines.push(`  response=${rsp.slice(0, 500)}${rsp.length > 500 ? "…" : ""}`);
  }
  console.error(lines.join("\n"));
}
