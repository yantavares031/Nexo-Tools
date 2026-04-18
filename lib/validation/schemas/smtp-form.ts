import { z } from "zod";

const singleEmailSchema = z.string().check(z.email({ error: () => "E-mail inválido." }));

/** Extrai e valida até 30 e-mails (linha, vírgula ou ponto e vírgula). */
export function parseOrdemCompraNotifyEmailsFromText(
  raw: string
): { ok: true; emails: string[] } | { ok: false; message: string } {
  const tokens = [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((x) => x.trim())
        .filter(Boolean)
    ),
  ];
  if (tokens.length > 30) {
    return {
      ok: false,
      message: "No máximo 30 e-mails na lista de notificações de ordem de compra.",
    };
  }
  const emails: string[] = [];
  for (const t of tokens) {
    const r = singleEmailSchema.safeParse(t);
    if (!r.success) {
      return { ok: false, message: `E-mail inválido na lista de OC: ${t}` };
    }
    emails.push(t);
  }
  return { ok: true, emails };
}

export function formDataToSmtpRaw(formData: FormData) {
  return {
    smtpHost: String(formData.get("smtpHost") ?? ""),
    smtpPort: String(formData.get("smtpPort") ?? "587"),
    smtpUser: String(formData.get("smtpUser") ?? ""),
    smtpPassword: String(formData.get("smtpPassword") ?? ""),
    enabled: String(formData.get("enabled") ?? "false"),
    ordemCompraNotifyEmails: String(formData.get("ordemCompraNotifyEmails") ?? ""),
  };
}

export const smtpSaveFormSchema = z.object({
  smtpHost: z.string().trim().max(500),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().trim().max(500),
  smtpPassword: z.string().max(2000),
  enabled: z
    .string()
    .transform((v) => v === "true"),
  ordemCompraNotifyEmails: z.string().max(20000),
});

export function formDataToSmtpTestRaw(formData: FormData) {
  return { testEmail: String(formData.get("testEmail") ?? "") };
}

export const smtpTestEmailSchema = z.object({
  testEmail: z
    .string()
    .trim()
    .min(1, "Informe o e-mail de destino do teste.")
    .check(z.email({ error: () => "E-mail de destino inválido." })),
});
