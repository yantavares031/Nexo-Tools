import nodemailer from "nodemailer";
import type { SmtpConfig } from "@/types/globals";
import { logSmtpCredentialsAttempt } from "@/lib/infra/smtp-debug-log";
import { formatSmtpErrorForUser, logSmtpFailureToConsole } from "@/lib/infra/smtp-error-format";

/** Remove espaços acidentais; alinha o que vai no log com o que o Nodemailer envia. */
function normalizeSmtpConfig(config: SmtpConfig): SmtpConfig {
  return {
    ...config,
    smtpHost: (config.smtpHost || "").trim() || "smtp.gmail.com",
    smtpUser: config.smtpUser.trim(),
    smtpPassword: config.smtpPassword.trim(),
  };
}

/**
 * Envia um e-mail de teste usando a configuração salva (ex.: Gmail com senha de app).
 * Erros e credenciais (conforme DEBUG_SMTP_LOG_CREDENTIALS) são logados no terminal do servidor.
 */
export async function sendSmtpTestMail(config: SmtpConfig, to: string): Promise<void> {
  const cfg = normalizeSmtpConfig(config);
  logSmtpCredentialsAttempt(cfg, "Tentativa de envio (credenciais carregadas do banco)");

  const port = cfg.smtpPort;
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port,
    secure,
    /** Gmail na 587 usa STARTTLS; evita falhas intermitentes de handshake. */
    requireTLS: !secure && port === 587,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: cfg.smtpUser,
      to: to.trim(),
      subject: "NEXO Tools — teste de e-mail (SMTP)",
      text:
        "Este é um e-mail de teste enviado pelas integrações do NEXO Tools.\n\nSe você recebeu, a configuração SMTP está correta.",
    });
    console.error(`[SMTP] ✓ E-mail de teste aceito pelo servidor e enfileirado para ${to.trim()}`);
  } catch (err) {
    logSmtpFailureToConsole(err, { phase: "sendMail", to: to.trim() });
    logSmtpCredentialsAttempt(cfg, "Contexto após falha (mesmas credenciais da tentativa)");
    const friendly = formatSmtpErrorForUser(err);
    const wrapped = new Error(friendly, { cause: err });
    throw wrapped;
  }
}
