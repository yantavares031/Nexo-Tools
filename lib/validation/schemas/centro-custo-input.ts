import { z } from "zod";

export const centroCustoNomeSchema = z.object({
  nome: z.string().trim().min(1, "O nome é obrigatório.").max(500),
});

/** Atualização parcial: só valida campos presentes. */
export const centroCustoUpdateSchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").max(500),
  })
  .partial();
