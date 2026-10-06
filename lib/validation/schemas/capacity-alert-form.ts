import { z } from "zod";

export function formDataToCapacityAlertRaw(formData: FormData) {
  return {
    enabled: String(formData.get("enabled") ?? "false"),
    thresholds: String(formData.get("thresholds") ?? ""),
  };
}

const thresholdSchema = z.coerce
  .number<string>({ error: () => "Os limites devem ser números, separados por vírgula." })
  .int({ error: () => "Os limites devem ser números inteiros (ex.: 80, 100)." })
  .min(1, { error: () => "Cada limite deve ser de pelo menos 1%." })
  .max(200, { error: () => "Cada limite deve ser de no máximo 200%." });

export const capacityAlertFormSchema = z.object({
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
  thresholds: z
    .string()
    .transform((raw) =>
      raw
        .split(/[,;\s]+/)
        .map((part) => part.replace("%", "").trim())
        .filter(Boolean)
    )
    .pipe(z.array(thresholdSchema).max(5, { error: () => "Informe no máximo 5 limites." })),
});
