import { z } from "zod";

export function formDataToDeskfyIntegrationSettingsRaw(formData: FormData) {
  return {
    baseUrl: String(formData.get("baseUrl") ?? ""),
    lookbackDays: String(formData.get("lookbackDays") ?? ""),
  };
}

export const deskfyIntegrationSettingsFormSchema = z.object({
  baseUrl: z.string().trim().min(1, "Informe a URL base.").max(2000),
  lookbackDays: z.coerce.number().int().min(0).max(180),
});

export function formDataToDeskfyApiKeyRaw(formData: FormData) {
  return {
    apiKey: String(formData.get("apiKey") ?? ""),
  };
}

export const deskfyApiKeyFormSchema = z.object({
  apiKey: z.string().min(1, "Informe a chave API.").max(2000),
});
