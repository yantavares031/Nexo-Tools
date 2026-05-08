import { z } from "zod";
import { normalizeWhatsAppPlatformId } from "@/lib/whatsapp-platform";

export function formDataToWhatsAppConnectRaw(formData: FormData) {
  return {
    platform: String(formData.get("platform") ?? "uazapi"),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    adminToken: String(formData.get("adminToken") ?? ""),
    apiToken: String(formData.get("apiToken") ?? ""),
    zapiInstanceId: String(formData.get("zapiInstanceId") ?? ""),
    evolutionInstanceName: String(formData.get("evolutionInstanceName") ?? ""),
  };
}

export const whatsAppConnectFormSchema = z
  .object({
    platform: z.string().transform((s) => normalizeWhatsAppPlatformId(s)),
    baseUrl: z.string(),
    adminToken: z.string(),
    apiToken: z.string(),
    zapiInstanceId: z.string(),
    evolutionInstanceName: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.baseUrl.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe a URL.",
        path: ["baseUrl"],
      });
    }
    if (data.platform === "z-api") {
      if (!data.zapiInstanceId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o ID da instância.",
          path: ["zapiInstanceId"],
        });
      }
    }
    if (data.platform === "evolution") {
      if (!data.evolutionInstanceName.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o nome da instância.",
          path: ["evolutionInstanceName"],
        });
      }
    }
  });

export const whatsAppSelectInstanceSchema = z.object({
  instanceId: z.string().trim().min(1, "Selecione uma instância."),
});
