import { z } from "zod";

export function formDataToProfileNameRaw(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
  };
}

export const profileNameFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(120, "Nome muito longo."),
});

export function formDataToProfilePasswordRaw(formData: FormData) {
  return {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

export const profilePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres."),
    confirmPassword: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A confirmação não coincide com a nova senha.",
        path: ["confirmPassword"],
      });
    }
  });
