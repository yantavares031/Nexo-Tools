import { z } from "zod";

/** Entrada bruta vinda de `FormData` (todos os campos como string). */
export type CreateUserFormRaw = {
  email: string;
  name: string;
  role: string;
  agenciaId: string;
  acesso: string | undefined;
};

export function formDataToCreateUserRaw(formData: FormData): CreateUserFormRaw {
  return {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "operator"),
    agenciaId: String(formData.get("agenciaId") ?? ""),
    acesso:
      formData.get("acesso") === null || formData.get("acesso") === undefined
        ? undefined
        : String(formData.get("acesso")),
  };
}

/**
 * Validação na fronteira da Server Action (zero trust — o client pode enviar qualquer FormData).
 */
export const createUserFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "E-mail é obrigatório.")
      .check(z.email({ error: () => "E-mail inválido." })),
    name: z
      .string()
      .trim()
      .max(500)
      .transform((s) => (s === "" ? undefined : s)),
    role: z.enum(["admin", "operator", "agency"], {
      error: () => "Perfil inválido.",
    }),
    agenciaId: z
      .string()
      .trim()
      .transform((s) => (s === "" ? undefined : s)),
    acesso: z
      .string()
      .optional()
      .transform((v) => v !== "false"),
  })
  .transform((data) => ({
    email: data.email,
    name: data.name,
    role: data.role,
    agenciaId: data.role === "agency" ? data.agenciaId : undefined,
    acesso: data.acesso,
  }));

export type CreateUserFormParsed = z.infer<typeof createUserFormSchema>;
