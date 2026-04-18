import { buildSystemEmailHtml } from "@/lib/email/system-email-template";
import { escapeHtml } from "@/lib/email/html-escape";

export type NewUserCredentialsEmailParams = {
  recipientName?: string;
  loginEmail: string;
  temporaryPassword: string;
  loginPageUrl: string;
};

function greeting(name?: string): string {
  const n = name?.trim();
  if (n) return `Olá, ${escapeHtml(n)}`;
  return "Olá";
}

/**
 * Corpo e versão texto do e-mail de boas-vindas com credenciais provisórias.
 */
export function buildNewUserCredentialsEmail(
  params: NewUserCredentialsEmailParams
): { html: string; text: string } {
  const { recipientName, loginEmail, temporaryPassword, loginPageUrl } = params;
  const safeEmail = escapeHtml(loginEmail);
  const safePass = escapeHtml(temporaryPassword);
  const safeUrl = escapeHtml(loginPageUrl);

  const innerHtml = `
    <p style="margin:0 0 16px 0;">${greeting(recipientName)},</p>
    <p style="margin:0 0 16px 0;">Sua conta no <strong>NEXO Tools</strong> foi criada. Use os dados abaixo para o primeiro acesso:</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 20px 0;background-color:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Login (e-mail)</p>
          <p style="margin:0 0 18px 0;font-size:15px;font-family:ui-monospace,monospace;color:#0f172a;word-break:break-all;">${safeEmail}</p>
          <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#64748b;">Senha temporária</p>
          <p style="margin:0;font-size:15px;font-family:ui-monospace,monospace;color:#0f172a;word-break:break-all;letter-spacing:0.02em;">${safePass}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px 0;padding:12px 14px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:14px;color:#92400e;">
      <strong>Importante:</strong> no primeiro acesso será solicitada a <strong>alteração da senha</strong> por uma senha definida por você.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px 0;">
      <tr>
        <td style="border-radius:8px;background-color:#2563eb;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Acessar o NEXO Tools</a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0 0;font-size:13px;color:#64748b;">Se o botão não funcionar, copie e cole este link no navegador:<br /><span style="word-break:break-all;color:#2563eb;">${safeUrl}</span></p>
  `.trim();

  const textName = recipientName?.trim();
  const greet = textName ? `Olá, ${textName}` : "Olá";
  const text = `${greet},

Sua conta no NEXO Tools foi criada. Use os dados abaixo para o primeiro acesso:

Login (e-mail): ${loginEmail}
Senha temporária: ${temporaryPassword}

Importante: no primeiro acesso será solicitada a alteração da senha por uma senha definida por você.

Acesse: ${loginPageUrl}

---
NEXO Tools · e-mail automático`;

  const html = buildSystemEmailHtml({
    preheader: `Seu login e senha temporária para o NEXO Tools`,
    title: "Bem-vindo ao NEXO Tools",
    innerHtml,
  });

  return { html, text };
}
