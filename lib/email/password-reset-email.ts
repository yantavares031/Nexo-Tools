import { emailKeywordHighlight } from "@/lib/email/email-text-styles";
import { buildSystemEmailHtml } from "@/lib/email/system-email-template";
import { escapeHtml } from "@/lib/email/html-escape";

export type PasswordResetEmailParams = {
  recipientName?: string;
  resetUrl: string;
  expiresInMinutes: number;
};

/** Corpo e versão texto do e-mail com o link para redefinir a senha. */
export function buildPasswordResetEmail(params: PasswordResetEmailParams): { html: string; text: string } {
  const { recipientName, resetUrl, expiresInMinutes } = params;
  const name = recipientName?.trim();
  const greetingHtml = name ? `Olá, ${escapeHtml(name)}` : "Olá";
  const safeUrl = escapeHtml(resetUrl);

  const innerHtml = `
    <p style="margin:0 0 16px 0;">${greetingHtml},</p>
    <p style="margin:0 0 16px 0;">Recebemos um pedido para ${emailKeywordHighlight("redefinir a senha")} da sua conta no ${emailKeywordHighlight("NEXO Tools")}.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px 0;">
      <tr>
        <td style="border-radius:8px;background-color:#2563eb;">
          <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Redefinir minha senha</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px 0;padding:12px 14px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:14px;color:#92400e;">
      O link vale por <strong>${expiresInMinutes} minutos</strong> e só pode ser usado uma vez. Se você não pediu a troca, ignore este e-mail: sua senha atual continua valendo.
    </p>
    <p style="margin:16px 0 0 0;font-size:13px;color:#64748b;">Se o botão não funcionar, copie e cole este link no navegador:<br /><span style="word-break:break-all;color:#2563eb;">${safeUrl}</span></p>
  `.trim();

  const text = `${name ? `Olá, ${name}` : "Olá"},

Recebemos um pedido para redefinir a senha da sua conta no NEXO Tools.

Redefinir senha: ${resetUrl}

O link vale por ${expiresInMinutes} minutos e só pode ser usado uma vez. Se você não pediu a troca, ignore este e-mail: sua senha atual continua valendo.

---
NEXO Tools · e-mail automático`;

  const html = buildSystemEmailHtml({
    preheader: "Link para redefinir sua senha no NEXO Tools",
    title: "Redefinir senha",
    innerHtml,
  });

  return { html, text };
}
