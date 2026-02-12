"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { loginUseCase } from "@/lib/use-cases/login.use-case";
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

  await createSession(
    user.email,
    user.name ?? user.email,
    user.role,
    user.agenciaId
  );
  redirect("/");
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/login");
}
