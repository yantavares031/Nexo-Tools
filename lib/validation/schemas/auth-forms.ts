import { z } from "zod";

export function formDataToLoginRaw(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

/** Falhas mapeadas para `redirect("/login?error=…")` — manter `empty` e `invalid` como no fluxo atual. */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "empty")
    .check(z.email({ error: () => "empty" })),
  password: z.string().min(1, "empty"),
});

export function formDataToChangePasswordRaw(formData: FormData) {
  return {
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

export const changePasswordFormSchema = z.object({
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(1, "Confirme a nova senha."),
});
