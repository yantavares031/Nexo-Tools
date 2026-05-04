"use server";

import { revalidatePath } from "next/cache";
import { createSession, getSession, sessionUserFromDbUser } from "@/lib/auth";
import { getUserRepository } from "@/lib/repositories";
import { changeOwnPasswordUseCase } from "@/lib/use-cases/change-own-password.use-case";
import { updateOwnProfileAvatarUseCase } from "@/lib/use-cases/update-own-profile-avatar.use-case";
import { updateOwnProfileNameUseCase } from "@/lib/use-cases/update-own-profile-name.use-case";
import {
  formDataToProfileNameRaw,
  formDataToProfilePasswordRaw,
  profileNameFormSchema,
  profilePasswordFormSchema,
} from "@/lib/validation/schemas/profile-forms";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";

export type ProfileActionState = { error?: string; ok?: boolean } | null;

export async function updateProfileNameAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = profileNameFormSchema.safeParse(formDataToProfileNameRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    await updateOwnProfileNameUseCase(
      { userId: session.userId, name: parsed.data.name },
      { userRepository: getUserRepository() }
    );
    const user = await getUserRepository().findById(session.userId);
    if (user) await createSession(sessionUserFromDbUser(user));
  } catch (err) {
    await logServerActionError("updateProfileNameAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar nome.",
    };
  }

  revalidatePath("/perfil");
  return { ok: true };
}

export async function changeProfilePasswordAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const parsed = profilePasswordFormSchema.safeParse(formDataToProfilePasswordRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  try {
    await changeOwnPasswordUseCase(
      {
        userId: session.userId,
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      },
      { userRepository: getUserRepository() }
    );
    const user = await getUserRepository().findById(session.userId);
    if (user) await createSession(sessionUserFromDbUser(user));
  } catch (err) {
    await logServerActionError("changeProfilePasswordAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao alterar senha.",
    };
  }

  revalidatePath("/perfil");
  return { ok: true };
}

export async function updateProfileAvatarAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await updateOwnProfileAvatarUseCase(
      {
        userId: session.userId,
        buffer,
        contentType: file.type || "application/octet-stream",
      },
      { userRepository: getUserRepository() }
    );
    const user = await getUserRepository().findById(session.userId);
    if (user) await createSession(sessionUserFromDbUser(user));
  } catch (err) {
    await logServerActionError("updateProfileAvatarAction", err);
    return {
      error: err instanceof Error ? err.message : "Erro ao enviar foto.",
    };
  }

  revalidatePath("/perfil");
  return { ok: true };
}
