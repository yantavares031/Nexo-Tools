import { z } from "zod";

export function formDataToUpdateUserRaw(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "operator"),
    agenciaId: String(formData.get("agenciaId") ?? ""),
    acesso: String(formData.get("acesso") ?? "true"),
  };
}

export const updateUserFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "E-mail é obrigatório.")
      .check(z.email({ error: () => "E-mail inválido." })),
    password: z.string(),
    name: z.string().trim(),
    role: z.enum(["admin", "operator", "agency"], {
      error: () => "Perfil inválido.",
    }),
    agenciaId: z
      .string()
      .trim()
      .transform((s) => (s === "" ? undefined : s)),
    acesso: z.string().transform((v) => v === "true"),
  })
  .transform((d) => ({
    email: d.email,
    password: d.password,
    name: d.name === "" ? undefined : d.name,
    role: d.role,
    agenciaId: d.role === "agency" ? d.agenciaId : undefined,
    acesso: d.acesso,
  }));
