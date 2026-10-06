import { z } from "zod";
import type { RealtimeNoticeTarget } from "@/types/globals";

export function formDataToRealtimeNoticeRaw(formData: FormData) {
  return {
    target: String(formData.get("target") ?? ""),
    title: String(formData.get("title") ?? ""),
    message: String(formData.get("message") ?? ""),
    variant: String(formData.get("variant") ?? "info"),
  };
}

const roleSchema = z.enum(["admin", "operator", "agency"]);

/** Destino vem do select como `all`, `role:<perfil>` ou `user:<id>`. */
const targetSchema = z.string().transform((raw, ctx): RealtimeNoticeTarget => {
  if (raw === "all") return { type: "all" };
  const [type, value = ""] = raw.split(":", 2);
  if (type === "role") {
    const role = roleSchema.safeParse(value);
    if (role.success) return { type: "role", role: role.data };
  }
  if (type === "user" && value.trim()) return { type: "user", userId: value.trim() };
  ctx.addIssue({ code: "custom", message: "Escolha para quem enviar o aviso." });
  return z.NEVER;
});

export const realtimeNoticeFormSchema = z.object({
  target: targetSchema,
  title: z
    .string()
    .trim()
    .min(1, { error: () => "Informe o título do aviso." })
    .max(80, { error: () => "O título deve ter no máximo 80 caracteres." }),
  message: z
    .string()
    .trim()
    .min(1, { error: () => "Informe a mensagem do aviso." })
    .max(300, { error: () => "A mensagem deve ter no máximo 300 caracteres." }),
  variant: z.enum(["info", "success", "warning"], { error: () => "Tipo de aviso inválido." }),
});

export const disconnectUserSchema = z.object({
  userId: z.string().trim().min(1, { error: () => "Usuário inválido." }),
});
