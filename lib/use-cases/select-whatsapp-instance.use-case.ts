import { randomUUID } from "crypto";
import type { IWhatsAppIntegrationRepository } from "@/lib/domain/whatsapp-integration.repository";
import type { IWhatsAppProvider } from "@/lib/contracts/whatsapp-provider";
import { convertProfileImageToOptimizedWebp } from "@/lib/image/profile-avatar-to-webp";
import {
  buildWhatsAppInstanceProfilePicKey,
  deleteAppObjectFromR2,
  isR2StorageConfigured,
  putAppObjectToR2,
} from "@/lib/r2-upload";
import { isWhatsAppUazapiPlatform } from "@/lib/whatsapp-platform";

type Dependencies = {
  whatsAppIntegrationRepository: IWhatsAppIntegrationRepository;
  whatsAppProvider: IWhatsAppProvider;
};

async function bufferFromImageUrl(url: string): Promise<Buffer | null> {
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("data:image")) {
    const m = /^data:image\/\w+;base64,(.+)$/i.exec(u);
    if (!m) return null;
    try {
      return Buffer.from(m[1], "base64");
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(u, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function selectWhatsAppInstanceUseCase(
  instanceId: string,
  deps: Dependencies
): Promise<void> {
  const id = instanceId.trim();
  if (!id) throw new Error("Instância inválida.");

  const cfg = await deps.whatsAppIntegrationRepository.get();
  const baseUrl = cfg?.baseUrl?.trim() ?? "";
  const admin = cfg?.adminToken?.trim() ?? "";

  if (!cfg || !isWhatsAppUazapiPlatform(cfg.platform)) {
    throw new Error("Seleção de instância disponível apenas para UAZAPI.");
  }

  if (!baseUrl || !admin) {
    throw new Error("Informe a URL base e o token de administrador e salve antes de escolher uma instância.");
  }

  const previousStorageKey = cfg.profilePicStorageKey?.trim() || null;
  const previousInstanceId = cfg.selectedInstanceId?.trim() || null;

  if (previousInstanceId !== id && previousStorageKey) {
    await deleteAppObjectFromR2(previousStorageKey).catch(() => {});
  }

  const list = await deps.whatsAppProvider.listInstances(baseUrl, admin);
  const picked = list.find((x) => x.id === id);
  if (!picked?.token) {
    throw new Error("Instância não encontrada. Use Conectar para atualizar a lista.");
  }

  const live = await deps.whatsAppProvider.getInstanceStatus(baseUrl, picked.token);
  const merged = live.instance;

  const jidRaw = live.statusBlock?.jid;
  const jid =
    jidRaw != null && String(jidRaw).trim() !== "" ? String(jidRaw).trim() : null;

  let businessProfileJson: string | null = null;
  if (jid) {
    const bp = await deps.whatsAppProvider.fetchBusinessProfile(baseUrl, picked.token, jid);
    if (bp !== null && bp !== undefined) {
      try {
        businessProfileJson = JSON.stringify(bp);
      } catch {
        businessProfileJson = null;
      }
    }
  }

  const picUrlCandidate =
    merged.profilePicUrl?.trim() ||
    picked.profilePicUrl?.trim() ||
    (typeof merged.raw.profilePicUrl === "string" ? merged.raw.profilePicUrl.trim() : "") ||
    null;

  let profilePicStorageKey: string | null = null;

  if (picUrlCandidate && isR2StorageConfigured()) {
    const bufRaw = await bufferFromImageUrl(picUrlCandidate);
    if (bufRaw && bufRaw.length > 0) {
      try {
        const webp = await convertProfileImageToOptimizedWebp(bufRaw);
        const fileId = randomUUID();
        const key = buildWhatsAppInstanceProfilePicKey(id, fileId);
        await putAppObjectToR2({ key, body: webp, contentType: "image/webp" });
        profilePicStorageKey = key;
        if (previousStorageKey && previousStorageKey !== key) {
          await deleteAppObjectFromR2(previousStorageKey).catch(() => {});
        }
      } catch {
        profilePicStorageKey = null;
      }
    }
  }

  const instancePayloadJson = JSON.stringify({
    instance: merged.raw,
    status: live.statusBlock ?? null,
    listRow: picked.raw,
  });

  await deps.whatsAppIntegrationRepository.saveInstanceSelection({
    selectedInstanceId: id,
    instanceToken: picked.token,
    instanceName: merged.name ?? picked.name ?? null,
    instanceStatus: merged.status ?? picked.status ?? null,
    profileName: merged.profileName ?? picked.profileName ?? null,
    profilePicUrl: picUrlCandidate,
    profilePicStorageKey,
    businessProfileJson,
    instancePayloadJson,
  });
}
