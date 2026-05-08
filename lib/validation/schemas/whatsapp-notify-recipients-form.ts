import { z } from "zod";
import { normalizeNotifyRecipientsUnique } from "@/lib/whatsapp-notify-recipients";

function recipientsFromJsonString(raw: string): string[] {
  try {
    const p = JSON.parse(raw.trim() || "[]") as unknown;
    if (!Array.isArray(p)) return [];
    const strings = p
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return normalizeNotifyRecipientsUnique(strings);
  } catch {
    return [];
  }
}

export const whatsAppNotifyRecipientsFormSchema = z
  .object({
    recipientsJson: z.string(),
  })
  .transform((o) => ({
    recipients: recipientsFromJsonString(o.recipientsJson),
  }))
  .pipe(
    z.object({
      recipients: z.array(z.string().min(1).max(80)).max(50),
    })
  );
