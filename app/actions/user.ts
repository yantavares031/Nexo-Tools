"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createUserUseCase } from "@/lib/use-cases/create-user.use-case";
import { updateUserUseCase } from "@/lib/use-cases/update-user.use-case";
import { removeUserUseCase } from "@/lib/use-cases/remove-user.use-case";
import { getUserRepository, getSmtpConfigRepository } from "@/lib/repositories";
import type { UserInput, UserRole } from "@/types/globals";
import { generateTemporaryPassword } from "@/lib/generate-temporary-password";
import { sendNewUserCredentialsEmailUseCase } from "@/lib/use-cases/send-new-user-credentials-email.use-case";
import { getPublicAppBaseUrlForEmail } from "@/lib/public-app-url";
import {
  createUserFormSchema,
  formDataToCreateUserRaw,
} from "@/lib/validation/schemas/create-user-form";
import { zodErrorToActionMessage } from "@/lib/validation/zod-to-action-error";
import { logServerActionError } from "@/lib/server-action-log";
import {
  formDataToUpdateUserRaw,
  updateUserFormSchema,
} from "@/lib/validation/schemas/update-user-form";
import { parseUserRecordId } from "@/lib/validation/schemas/common";

export type CreateUserEmailNotice = "sent" | "skipped_smtp" | "failed";

export type CreateUserActionState =
  | null
  | { error: string }
  | {
      ok: true;
      userEmail: string;
      temporaryPassword: string;
      emailNotice: CreateUserEmailNotice;
      emailError?: string;
    };

export async function createUserAction(
  _prevState: CreateUserActionState,
  formData: FormData
): Promise<CreateUserActionState> {
  const parsed = createUserFormSchema.safeParse(formDataToCreateUserRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) };
  }

  const { email, name, role, agenciaId, acesso } = parsed.data;

  const plainPassword = generateTemporaryPassword(14);

  const input: UserInput = {
    email,
    password: plainPassword,
    name,
    role: role as UserRole,
    agenciaId,
    acesso,
  };

  const userRepository = getUserRepository();

  try {
    await createUserUseCase(input, { userRepository });
  } catch (err) {
    await logServerActionError("createUserAction", err, { email });
    return {
      error: err instanceof Error ? err.message : "Erro ao cadastrar usuário.",
    };
  }

  const loginPageUrl = `${getPublicAppBaseUrlForEmail()}/login`;
  const emailResult = await sendNewUserCredentialsEmailUseCase(
    {
      to: email,
      recipientName: name,
      loginEmail: email,
      temporaryPassword: plainPassword,
      loginPageUrl,
    },
    { smtpConfigRepository: getSmtpConfigRepository() }
  );

  let emailNotice: CreateUserEmailNotice;
  let emailError: string | undefined;
  if (emailResult.status === "sent") {
    emailNotice = "sent";
  } else if (emailResult.status === "skipped") {
    emailNotice = "skipped_smtp";
  } else {
    emailNotice = "failed";
    emailError = emailResult.message;
  }

  revalidatePath("/usuarios");
  return {
    ok: true,
    userEmail: email,
    temporaryPassword: plainPassword,
    emailNotice,
    emailError,
  };
}

export async function updateUserAction(
  id: string,
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const idCheck = parseUserRecordId(id);
  if (!idCheck.ok) {
    return { error: idCheck.error } as const;
  }

  const parsed = updateUserFormSchema.safeParse(formDataToUpdateUserRaw(formData));
  if (!parsed.success) {
    return { error: zodErrorToActionMessage(parsed.error) } as const;
  }

  const { email, password, name, role, agenciaId, acesso } = parsed.data;

  const userRepository = getUserRepository();

  try {
    await updateUserUseCase(
      idCheck.id,
      {
        email,
        password: password || undefined,
        name,
        role: role as UserRole,
        agenciaId,
        acesso,
      },
      { userRepository }
    );
  } catch (err) {
    await logServerActionError("updateUserAction", err, { id: idCheck.id, email });
    return {
      error: err instanceof Error ? err.message : "Erro ao atualizar usuário.",
    } as const;
  }

  revalidatePath("/usuarios");
  redirect("/usuarios?updated=1");
}

export async function removeUserAction(id: string) {
  const idCheck = parseUserRecordId(id);
  if (!idCheck.ok) {
    redirect("/usuarios?error=" + encodeURIComponent(idCheck.error));
  }

  const userRepository = getUserRepository();
  try {
    await removeUserUseCase(idCheck.id, { userRepository });
  } catch (err) {
    await logServerActionError("removeUserAction", err, { id: idCheck.id });
    redirect("/usuarios?error=" + encodeURIComponent("Erro ao remover usuário."));
  }
  revalidatePath("/usuarios");
  redirect("/usuarios?removed=1");
}
