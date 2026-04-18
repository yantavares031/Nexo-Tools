import { z } from "zod";

export const deskfyBoardNomeSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome do board.")
  .max(500);

export const deskfyTaskIdSchema = z.coerce.number().int().positive("ID da tarefa inválido.");

export function formDataToDeskfyWorkflowRaw(formData: FormData) {
  return {
    initialDate: String(formData.get("initialDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    briefingId: String(formData.get("briefingId") ?? ""),
    boardName: String(formData.get("boardName") ?? ""),
    columnName: String(formData.get("columnName") ?? ""),
    generateAttachmentPublicUrl: String(formData.get("generateAttachmentPublicUrl") ?? ""),
  };
}

export const deskfyWorkflowReportFormSchema = z
  .object({
    initialDate: z.string().trim().max(40),
    endDate: z.string().trim().max(40),
    briefingId: z.string().trim().max(20),
    boardName: z.string().trim().max(500),
    columnName: z.string().trim().max(500),
    generateAttachmentPublicUrl: z.string().trim().max(10),
  })
  .superRefine((val, ctx) => {
    const b = val.briefingId.trim();
    if (b === "") return;
    const n = Number.parseInt(b, 10);
    if (!Number.isFinite(n) || n < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Briefing ID inválido.",
      });
    }
  })
  .transform((raw) => ({
    initialDate: raw.initialDate,
    endDate: raw.endDate,
    briefingId:
      raw.briefingId.trim() === ""
        ? undefined
        : Number.parseInt(raw.briefingId.trim(), 10),
    boardName: raw.boardName.trim() || undefined,
    columnName: raw.columnName.trim() || undefined,
    generateAttachmentPublicUrl:
      raw.generateAttachmentPublicUrl === "true"
        ? true
        : raw.generateAttachmentPublicUrl === "false"
          ? false
          : undefined,
  }));
