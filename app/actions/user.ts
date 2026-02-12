"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createUserUseCase } from "@/lib/use-cases/create-user.use-case";
import { updateUserUseCase } from "@/lib/use-cases/update-user.use-case";
import { removeUserUseCase } from "@/lib/use-cases/remove-user.use-case";
import { getUserRepository } from "@/lib/repositories";
import type { UserInput, UserRole } from "@/types/globals";

const VALID_ROLES: UserRole[] = ["admin", "operator", "agency"];

export async function createUserAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const name = (formData.get("name") as string)?.trim() ?? "";
  const roleRaw = (formData.get("role") as string) ?? "operator";
  const role = VALID_ROLES.includes(roleRaw as UserRole)
    ? (roleRaw as UserRole)
    : "operator";
  const agenciaId = (formData.get("agenciaId") as string)?.trim() || undefined;

  if (!email || !password) {
    return {
      error: "E-mail e senha são obrigatórios.",
    } as const;
  }

  if (!["admin", "operator", "agency"].includes(role)) {
    return {
      error: "Perfil inválido.",
    } as const;
  }

  if (role === "agency" && !agenciaId) {
    return {
      error: "Usuários do tipo Agência precisam ter uma agência vinculada.",
    } as const;
  }

  const input: UserInput = {
    email,
    password,
    name: name || undefined,
    role,
    agenciaId: role === "agency" ? agenciaId : undefined,
  };

  const userRepository = getUserRepository();

  try {
    await createUserUseCase(input, { userRepository });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao cadastrar usuário.",
    } as const;
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function updateUserAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const name = (formData.get("name") as string)?.trim() ?? "";
  const roleRaw = (formData.get("role") as string) ?? "operator";
  const role = VALID_ROLES.includes(roleRaw as UserRole)
    ? (roleRaw as UserRole)
    : "operator";
  const agenciaId = (formData.get("agenciaId") as string)?.trim() || undefined;

  if (!email) {
    return { error: "E-mail é obrigatório." } as const;
  }

  if (role === "agency" && !agenciaId) {
    return {
      error: "Usuários do tipo Agência precisam ter uma agência vinculada.",
    } as const;
  }

  const userRepository = getUserRepository();

  try {
    await updateUserUseCase(
      id,
      {
        email,
        password: password || undefined,
        name: name || undefined,
        role,
        agenciaId: role === "agency" ? agenciaId : undefined,
      },
      { userRepository }
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar usuário.",
    } as const;
  }

  revalidatePath("/usuarios");
  redirect("/usuarios?updated=1");
}

export async function removeUserAction(id: string) {
  const userRepository = getUserRepository();
  await removeUserUseCase(id, { userRepository });
  revalidatePath("/usuarios");
  redirect("/usuarios?removed=1");
}
