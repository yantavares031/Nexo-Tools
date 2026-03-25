"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { loginUseCase } from "@/lib/use-cases/login.use-case";
import { changePasswordFirstAccessUseCase } from "@/lib/use-cases/change-password-first-access.use-case";
import { getUserRepository } from "@/lib/repositories";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    redirect("/login?error=empty");
  }

  const userRepository = getUserRepository();
  const user = await loginUseCase(email, password, { userRepository });

  if (!user) {
    redirect("/login?error=invalid");
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role,
    agenciaId: user.agenciaId,
    mustChangePassword: user.mustChangePassword,
  });

  if (user.mustChangePassword) {
    redirect("/primeiro-acesso");
  }
  redirect("/splash");
}

export async function changePasswordFirstAccessAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session?.userId) {
    return { error: "Sessão inválida. Faça login novamente." };
  }
  if (!session.mustChangePassword) {
    redirect("/");
  }

  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  const userRepository = getUserRepository();
  try {
    await changePasswordFirstAccessUseCase(
      { userId: session.userId, newPassword, confirmPassword },
      { userRepository }
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao alterar senha.",
    };
  }

  await createSession({
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    agenciaId: session.agenciaId,
    mustChangePassword: false,
  });

  redirect("/splash");
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/login");
}
