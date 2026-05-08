import { z } from "zod";

export const whatsAppAsyncDelayFormSchema = z
  .object({
    msgDelayMin: z.coerce.number().int().min(0).max(86400),
    msgDelayMax: z.coerce.number().int().min(0).max(86400),
  })
  .superRefine((data, ctx) => {
    if (data.msgDelayMax < data.msgDelayMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O delay máximo deve ser maior ou igual ao mínimo.",
        path: ["msgDelayMax"],
      });
    }
  });
