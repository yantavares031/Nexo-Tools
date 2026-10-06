"use server";

import { redirect } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { createSession, sessionUserFromDbUser } from "@/lib/auth";
import { loginUseCase } from "@/lib/use-cases/login.use-case";
import { changePasswordFirstAccessUseCase } from "@/lib/use-cases/change-password-first-access.use-case";
import {
  requestPasswordResetUseCase,
  type RequestPasswordResetResult,
} from "@/lib/use-cases/request-password-reset.use-case";
import {
  PasswordResetError,
  resetPasswordWithTokenUseCase,
} from "@/lib/use-cases/reset-password-with-token.use-case";
import { getSmtpConfigRepository, getUserRepository } from "@/lib/repositories";
import { getPasswordResetTokenService } from "@/lib/infra/hmac-password-reset-token.service";
import { sendSmtpMail } from "@/lib/infra/smtp-send-mail";
import { getPublicAppBaseUrlForEmail } from "@/lib/public-app-url";
import {
  changePasswordFormSchema,
  forgotPasswordFormSchema,
  formDataToChangePasswordRaw,
  formDataToLoginRaw,
  formDataToResetPasswordRaw,
  loginFormSchema,
  resetPasswordFormSchema,
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
    redirect(APP_CONFIG.homeHref);
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

const FORGOT_PASSWORD_PATH = "/login/esqueci-senha";
const RESET_PASSWORD_PATH = "/login/redefinir-senha";

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = forgotPasswordFormSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    redirect(`${FORGOT_PASSWORD_PATH}?error=${encodeURIComponent(zodErrorToActionMessage(parsed.error))}`);
  }

  const { email } = parsed.data;
  let status: RequestPasswordResetResult["status"];
  try {
    const result = await requestPasswordResetUseCase(
      { email, resetPageUrl: `${getPublicAppBaseUrlForEmail()}${RESET_PASSWORD_PATH}`, now: new Date() },
      {
        userRepository: getUserRepository(),
        smtpConfigRepository: getSmtpConfigRepository(),
        tokenService: getPasswordResetTokenService(),
        sendMail: (config, message) => sendSmtpMail(config, message),
      }
    );
    status = result.status;
  } catch (err) {
    await logServerActionError("requestPasswordResetAction", err, { email });
    redirect(
      `${FORGOT_PASSWORD_PATH}?error=${encodeURIComponent("Não foi possível enviar o e-mail agora. Tente novamente em instantes.")}`
    );
  }

  const ip = await getClientIp();
  appLogger.info(
    { event: "auth.password_reset.requested", action: "requestPasswordReset", email, status, ...(ip ? { ip } : {}) },
    "Pedido de redefinição de senha"
  );

  if (status === "smtp_not_configured") {
    redirect(
      `${FORGOT_PASSWORD_PATH}?error=${encodeURIComponent("O envio de e-mails não está configurado. Procure o administrador do sistema.")}`
    );
  }
  redirect(`${FORGOT_PASSWORD_PATH}?sent=1`);
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordFormSchema.safeParse(formDataToResetPasswordRaw(formData));
  const token = String(formData.get("token") ?? "");
  const backWithError = (message: string) =>
    `${RESET_PASSWORD_PATH}?token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`;

  if (!parsed.success) {
    redirect(backWithError(zodErrorToActionMessage(parsed.error)));
  }

  try {
    await resetPasswordWithTokenUseCase(
      { ...parsed.data, now: new Date() },
      { userRepository: getUserRepository(), tokenService: getPasswordResetTokenService() }
    );
  } catch (err) {
    if (err instanceof PasswordResetError) redirect(backWithError(err.message));
    await logServerActionError("resetPasswordAction", err);
    redirect(backWithError("Não foi possível redefinir a senha. Tente novamente."));
  }

  const ip = await getClientIp();
  appLogger.info(
    { event: "auth.password_reset.completed", action: "resetPassword", ...(ip ? { ip } : {}) },
    "Senha redefinida pelo link de e-mail"
  );
  redirect("/login?reset=1");
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
