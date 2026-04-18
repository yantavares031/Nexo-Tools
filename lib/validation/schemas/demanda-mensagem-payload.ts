import { z } from "zod";

export const addDemandaMensagemPayloadSchema = z.object({
  demandaId: z.string().trim().uuid("Identificador inválido."),
  mensagem: z.string().trim().min(1, "A mensagem não pode ser vazia.").max(20_000),
});
