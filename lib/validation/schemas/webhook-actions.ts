import { z } from "zod";

const eventCodeSchema = z.enum(["demanda.criada", "demanda.comprovada"]);

export function formDataToWebhookConfigRaw(formData: FormData) {
  return {
    url: String(formData.get("url") ?? ""),
    enabled: String(formData.get("enabled") ?? "false"),
    whatsappMod: String(formData.get("whatsappMod") ?? "false"),
    eventsJson: String(formData.get("events") ?? ""),
    contactListJson: String(formData.get("contactList") ?? ""),
  };
}

export const webhookConfigFormSchema = z.object({
  url: z.string().trim().max(4000),
  enabled: z.string().transform((v) => v === "true"),
  whatsappMod: z.string().transform((v) => v === "true"),
  eventsJson: z.string(),
  contactListJson: z.string(),
});

export function parseWebhookEventsJson(raw: string): z.infer<typeof eventCodeSchema>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: z.infer<typeof eventCodeSchema>[] = [];
    for (const e of parsed) {
      const r = eventCodeSchema.safeParse(e);
      if (r.success) out.push(r.data);
    }
    return out;
  } catch {
    return [];
  }
}

const contactRowSchema = z.object({
  phone: z.string(),
  name: z.string().optional(),
});

export function parseWebhookContactListJson(raw: string): { phone: string; name?: string }[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: { phone: string; name?: string }[] = [];
    for (const c of parsed) {
      const r = contactRowSchema.safeParse(c);
      if (!r.success) continue;
      const phone = r.data.phone.trim();
      const name = r.data.name?.trim() || undefined;
      if (phone.length > 0) out.push({ phone, name });
    }
    return out;
  } catch {
    return [];
  }
}

export const testWebhookUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Informe a URL do webhook para testar.")
    .check(z.url({ error: () => "URL do webhook inválida." })),
});
