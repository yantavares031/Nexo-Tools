import nodemailer from "nodemailer";
import type { SmtpConfig } from "@/types/globals";
import { logSmtpCredentialsAttempt } from "@/lib/infra/smtp-debug-log";
import { formatSmtpErrorForUser, logSmtpFailureToConsole } from "@/lib/infra/smtp-error-format";

/** Remove espaços acidentais; alinha o que vai no log com o que o Nodemailer envia. */
function normalizeSmtpConfig(config: SmtpConfig): SmtpConfig {
  return {
    ...config,
    ordemCompraNotifyEmails: config.ordemCompraNotifyEmails ?? [],
    smtpHost: (config.smtpHost || "").trim() || "smtp.gmail.com",
    smtpUser: config.smtpUser.trim(),
    smtpPassword: config.smtpPassword.trim(),
  };
}

function createSmtpTransporter(config: SmtpConfig) {
  const cfg = normalizeSmtpConfig(config);
  const port = cfg.smtpPort;
  const secure = port === 465;
  return nodemailer.createTransport({
    host: cfg.smtpHost,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPassword,
    },
  });
}

export type SmtpMailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendSmtpMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: SmtpMailAttachment[];
};

/**
 * Envia e-mail usando a configuração SMTP salva (texto e, opcionalmente, HTML).
 */
export async function sendSmtpMail(config: SmtpConfig, options: SendSmtpMailOptions): Promise<void> {
  const cfg = normalizeSmtpConfig(config);
  logSmtpCredentialsAttempt(cfg, "Tentativa de envio (credenciais carregadas do banco)");

  const transporter = createSmtpTransporter(cfg);

  try {
    await transporter.sendMail({
      from: cfg.smtpUser,
      to: options.to.trim(),
      subject: options.subject,
      text: options.text,
      ...(options.html ? { html: options.html } : {}),
      ...(options.attachments && options.attachments.length > 0
        ? {
            attachments: options.attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType ?? "application/octet-stream",
            })),
          }
        : {}),
    });
    console.error(`[SMTP] ✓ E-mail aceito pelo servidor e enfileirado para ${options.to.trim()}`);
  } catch (err) {
    logSmtpFailureToConsole(err, { phase: "sendMail", to: options.to.trim() });
    logSmtpCredentialsAttempt(cfg, "Contexto após falha (mesmas credenciais da tentativa)");
    const friendly = formatSmtpErrorForUser(err);
    const wrapped = new Error(friendly, { cause: err });
    throw wrapped;
  }
}

/**
 * Envia um e-mail de teste usando a configuração salva (ex.: Gmail com senha de app).
 * Erros e credenciais (conforme DEBUG_SMTP_LOG_CREDENTIALS) são logados no terminal do servidor.
 */
export async function sendSmtpTestMail(config: SmtpConfig, to: string): Promise<void> {
  await sendSmtpMail(config, {
    to: to.trim(),
    subject: "NEXO Tools — teste de e-mail (SMTP)",
    text:
      "Este é um e-mail de teste enviado pelas integrações do NEXO Tools.\n\nSe você recebeu, a configuração SMTP está correta.",
  });
}
