import { z } from "zod";

export function formDataToAgenciaRaw(formData: FormData) {
  return {
    nomeFantasia: String(formData.get("nomeFantasia") ?? ""),
    cnpj: String(formData.get("cnpj") ?? ""),
    orcamentoAnual: String(formData.get("orcamentoAnual") ?? ""),
    boardId: String(formData.get("boardId") ?? ""),
  };
}

export const agenciaFormSchema = z
  .object({
    nomeFantasia: z.string().trim().min(1, "Nome fantasia é obrigatório.").max(500),
    cnpj: z.string().trim().min(1, "CNPJ é obrigatório.").max(32),
    orcamentoAnual: z.string(),
    boardId: z
      .string()
      .trim()
      .transform((s) => (s === "" ? undefined : s)),
  });

export type AgenciaFormParsed = z.infer<typeof agenciaFormSchema>;
