import { z } from "zod";
import { demandaRecordIdSchema } from "@/lib/validation/schemas/common";

export const addDemandaMensagemPayloadSchema = z.object({
  demandaId: demandaRecordIdSchema,
  mensagem: z.string().trim().min(1, "A mensagem não pode ser vazia.").max(20_000),
});
