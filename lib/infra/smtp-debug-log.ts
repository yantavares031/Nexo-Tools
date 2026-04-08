import type { SmtpConfig } from "@/types/globals";

/**
 * Quando `DEBUG_SMTP_LOG_CREDENTIALS=true` no .env, imprime a senha em claro no terminal.
 * Use só em ambiente local para depurar 535 / BadCredentials. Remova ou desligue depois.
 */
export function shouldLogSmtpPasswordPlain(): boolean {
  return process.env.DEBUG_SMTP_LOG_CREDENTIALS?.trim() === "true";
}

/** Credenciais usadas na tentativa (sempre no stderr do Node / terminal do `next dev`). */
export function logSmtpCredentialsAttempt(config: SmtpConfig, label: string): void {
  const fullPass = shouldLogSmtpPasswordPlain();
  const lines = [
    `[SMTP] ${label}`,
    `  host=${config.smtpHost}`,
    `  port=${config.smtpPort}`,
    `  secure(465)=${config.smtpPort === 465}`,
    `  user=${config.smtpUser}`,
  ];
  if (fullPass) {
    lines.push(`  password(plain)=${JSON.stringify(config.smtpPassword)}`);
    lines.push(
      "  ⚠️ DEBUG_SMTP_LOG_CREDENTIALS=true — senha visível no log. Desligue após depurar."
    );
  } else {
    lines.push(
      `  password(length)=${config.smtpPassword.length} (defina DEBUG_SMTP_LOG_CREDENTIALS=true no .env para ver a senha no terminal)`
    );
  }
  console.error(lines.join("\n"));
}
