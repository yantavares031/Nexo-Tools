import { z } from "zod";
import { userRecordIdSchema } from "@/lib/validation/schemas/common";

export function formDataToCreateSolicitanteRaw(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? ""),
    unResponsavel: String(formData.get("unResponsavel") ?? ""),
  };
}

export const createSolicitanteFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório.").max(500),
  unResponsavel: z
    .string()
    .trim()
    .transform((s) => (s === "" ? undefined : s)),
});

export function formDataToUpdateSolicitanteRaw(formData: FormData) {
  return {
    id: String(formData.get("id") ?? ""),
    nome: String(formData.get("nome") ?? ""),
    unResponsavel: String(formData.get("unResponsavel") ?? ""),
  };
}

export const updateSolicitanteFormSchema = z.object({
  id: userRecordIdSchema,
  nome: z.string().trim().min(1, "Nome é obrigatório.").max(500),
  unResponsavel: z
    .string()
    .trim()
    .transform((s) => (s === "" ? undefined : s)),
});
