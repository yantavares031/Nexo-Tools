import { z } from "zod";
import { demandaRecordIdSchema } from "@/lib/validation/schemas/common";

const rowSchema = z.object({
  centroDeCusto: z.string().trim().min(1).max(500),
  valor: z.number().finite(),
  ordem: z.number().int().min(0),
});

export const saveCentrosCustoPayloadSchema = z.object({
  demandaId: demandaRecordIdSchema,
  centrosCusto: z.array(rowSchema).max(500),
});
