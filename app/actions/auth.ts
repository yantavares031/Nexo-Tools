"use server";

import { redirect } from "next/navigation";
import { createSession, sessionUserFromDbUser } from "@/lib/auth";
import { loginUseCase } from "@/lib/use-cases/login.use-case";
import { changePasswordFirstAccessUseCase } from "@/lib/use-cases/change-password-first-access.use-case";
import { getUserRepository } from "@/lib/repositories";
import {
  changePasswordFormSchema,
  formDataToChangePasswordRaw,
  formDataToLoginRaw,
  loginFormSchema,
} from "@/lib/validation/schemas/auth-forms";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { appLogger } from "@/lib/logger";
import { getClientIp, sessionUserToAuditFields } from "@/lib/logger/audit-context";
import { logServerActionError } from "@/lib/server-action-log";

export async function loginAction(formData: FormData) {
  const parsed = loginFormSchema.safeParse(formDataToLoginRaw(formData));
  if (!parsed.success) {
    redirect("/login?error=empty");
  }

  const { email, password } = parsed.data;

  const userRepository = getUserRepository();
  const user = await loginUseCase(email, password, { userRepository });

  if (!user) {
    const ip = await getClientIp();
    appLogger.warn(
      {
        event: "auth.login.failed",
        action: "login",
        email,
        ...(ip ? { ip } : {}),
      },
      "Login recusado (credenciais ou acesso)"
    );
    redirect("/login?error=invalid");
  }

  try {
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name ?? user.email,
      role: user.role,
      agenciaId: user.agenciaId,
      mustChangePassword: user.mustChangePassword,
      avatarKey: user.avatarKey,
    });
  } catch (err) {
    await logServerActionError("loginAction", err, { email });
    redirect("/login?error=invalid");
  }

  const ipLogin = await getClientIp();
  appLogger.info(
    {
      event: "auth.login.success",
      action: "login",
      ...sessionUserToAuditFields({
        userId: user.id,
        email: user.email,
        name: user.name ?? user.email,
        role: user.role,
        agenciaId: user.agenciaId,
        mustChangePassword: user.mustChangePassword,
      }),
      mustChangePassword: user.mustChangePassword,
      ...(ipLogin ? { ip: ipLogin } : {}),
    },
    "Login bem-sucedido"
  );

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

  const parsed = changePasswordFormSchema.safeParse(formDataToChangePasswordRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { newPassword, confirmPassword } = parsed.data;

  const userRepository = getUserRepository();
  try {
    await changePasswordFirstAccessUseCase(
      { userId: session.userId, newPassword, confirmPassword },
      { userRepository }
    );
    const fresh = await userRepository.findById(session.userId);
    if (fresh) {
      await createSession(sessionUserFromDbUser(fresh));
    }
  } catch (err) {
    await logServerActionError("changePasswordFirstAccessAction", err, {
      userId: session.userId,
    });
    return {
      error: err instanceof Error ? err.message : "Erro ao alterar senha.",
    };
  }

  redirect("/splash");
}

export async function logoutAction() {
  const { destroySession, getSession } = await import("@/lib/auth");
  const session = await getSession();
  const ip = await getClientIp();
  await destroySession();
  appLogger.info(
    {
      event: "auth.logout",
      action: "logout",
      ...(session ? sessionUserToAuditFields(session) : {}),
      ...(ip ? { ip } : {}),
    },
    "Logout"
  );
  redirect("/login");
}
