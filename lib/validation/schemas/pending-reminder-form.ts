import { z } from "zod";

export function formDataToPendingReminderRaw(formData: FormData) {
  return {
    enabled: String(formData.get("enabled") ?? "false"),
    ordemCompraDays: String(formData.get("ordemCompraDays") ?? ""),
    comprovacaoDays: String(formData.get("comprovacaoDays") ?? ""),
  };
}

const daysSchema = (label: string) =>
  z.coerce
    .number({ error: () => `Informe o prazo de ${label} em dias.` })
    .int({ error: () => `O prazo de ${label} deve ser um número inteiro.` })
    .min(1, { error: () => `O prazo de ${label} deve ser de pelo menos 1 dia.` })
    .max(365, { error: () => `O prazo de ${label} deve ser de no máximo 365 dias.` });

export const pendingReminderFormSchema = z.object({
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  ordemCompraDays: daysSchema("ordens de compra"),
  comprovacaoDays: daysSchema("comprovações"),
});
