import { APP_VERSION } from "@/lib/version";
import { escapeHtml } from "@/lib/email/html-escape";

/** Logo da marca nos e-mails (URL pública estável). */
export const SYSTEM_EMAIL_LOGO_URL =
  "https://i.postimg.cc/wTLSdwgr/Gemini-Generated-Image-8lvjxv8lvjxv8lvj.webp";

export type SystemEmailTemplateParams = {
  /** Texto curto para pré-visualização na caixa de entrada (opcional). */
  preheader?: string;
  /** Título em texto puro (usado em &lt;title&gt; do HTML e fallback do &lt;h1&gt;). */
  title: string;
  /** Se definido, substitui o título simples no &lt;h1&gt; (ex.: check verde + texto). */
  titleHtml?: string;
  /** Corpo em HTML (já seguro ou proveniente de trechos escapados). */
  innerHtml: string;
};

/**
 * Layout HTML reutilizável para e-mails transacionais (cores e tipografia alinhadas ao painel).
 */
export function buildSystemEmailHtml(params: SystemEmailTemplateParams): string {
  const { preheader, title, titleHtml, innerHtml } = params;
  const logoUrl = SYSTEM_EMAIL_LOGO_URL;
  const safeTitle = escapeHtml(title);
  const headingInner = titleHtml ?? escapeHtml(title);
  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 28px 20px 28px;border-bottom:1px solid #e2e8f0;background:linear-gradient(180deg,#fafafa 0%,#ffffff 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${escapeHtml(logoUrl)}" width="56" alt="NEXO Tools" style="display:inline-block;vertical-align:middle;max-width:56px;width:56px;height:auto;border-radius:8px;" />
                    <span style="display:inline-block;vertical-align:middle;margin-left:12px;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#334155;">
                      <span style="color:#2563eb;">NEXO</span> Tools
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px;font-size:12px;color:#64748b;line-height:1.45;">
                    Fluxos administrativos e financeiros de forma simples e integrada
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <h1 style="margin:0 0 16px 0;font-size:${titleHtml ? "inherit" : "18px"};font-weight:600;color:#1e293b;">${headingInner}</h1>
              <div style="font-size:15px;line-height:1.55;color:#334155;">${innerHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                NEXO Tools · v${escapeHtml(APP_VERSION)}<br />
                Este é um e-mail automático; não responda diretamente.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
