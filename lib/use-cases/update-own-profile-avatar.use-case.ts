import { randomUUID } from "crypto";
import type { IUserRepository } from "@/lib/domain/user.repository";
import type { User } from "@/types/globals";
import { convertProfileImageToOptimizedWebp } from "@/lib/image/profile-avatar-to-webp";
import {
  buildAvatarObjectKey,
  deleteAppObjectFromR2,
  isR2AppObjectKey,
  isR2StorageConfigured,
  putAppObjectToR2,
} from "@/lib/r2-upload";

type Dependencies = { userRepository: IUserRepository };

const MAX_INPUT_BYTES = 2 * 1024 * 1024;

/** Upload da foto de perfil: converte para WebP otimizado e grava no R2 (prefixo avatars/). */
export async function updateOwnProfileAvatarUseCase(
  input: { userId: string; buffer: Buffer; contentType: string },
  deps: Dependencies
): Promise<User> {
  if (!isR2StorageConfigured()) {
    throw new Error(
      "Não foi possível enviar a foto. Peça ao administrador do sistema para verificar as configurações de armazenamento."
    );
  }

  if (input.buffer.length > MAX_INPUT_BYTES) {
    throw new Error("Imagem muito grande (máximo 2 MB).");
  }

  if (input.buffer.length === 0) {
    throw new Error("Arquivo vazio.");
  }

  let webpBuffer: Buffer;
  try {
    webpBuffer = await convertProfileImageToOptimizedWebp(input.buffer);
  } catch {
    throw new Error(
      "Não foi possível processar a imagem. Envie um arquivo de imagem válido (JPG, PNG, WebP, GIF, etc.)."
    );
  }

  if (webpBuffer.length === 0) {
    throw new Error("Falha ao gerar a imagem. Tente outro arquivo.");
  }

  const user = await deps.userRepository.findById(input.userId);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const fileId = randomUUID();
  const key = buildAvatarObjectKey(user.id, fileId, ".webp");
  const oldKey = user.avatarKey;

  await putAppObjectToR2({
    key,
    body: webpBuffer,
    contentType: "image/webp",
  });

  try {
    const updated = await deps.userRepository.update(user.id, {
      email: user.email,
      name: user.name,
      role: user.role,
      agenciaId: user.agenciaId,
      acesso: user.acesso,
      avatarKey: key,
    });
    if (oldKey && oldKey !== key && isR2AppObjectKey(oldKey)) {
      await deleteAppObjectFromR2(oldKey).catch(() => {});
    }
    return updated;
  } catch (err) {
    await deleteAppObjectFromR2(key).catch(() => {});
    throw err;
  }
}
