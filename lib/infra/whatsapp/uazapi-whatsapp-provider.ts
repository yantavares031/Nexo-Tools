import type {
  IWhatsAppProvider,
  WhatsAppInstanceStatusResult,
  WhatsAppProviderInstanceSnapshot,
} from "@/lib/contracts/whatsapp-provider";

function joinApiUrl(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function readBodyJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function delaySecondsFromUnknown(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.trunc(v));
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

function snapshotFromUnknown(raw: Record<string, unknown>): WhatsAppProviderInstanceSnapshot {
  const id = raw.id != null ? String(raw.id) : "";
  const token = raw.token != null ? String(raw.token) : "";
  return {
    id,
    token,
    name: raw.name != null ? String(raw.name) : null,
    status: raw.status != null ? String(raw.status) : null,
    paircode: raw.paircode != null ? String(raw.paircode) : null,
    qrcode: raw.qrcode != null ? String(raw.qrcode) : null,
    profileName: raw.profileName != null ? String(raw.profileName) : null,
    profilePicUrl: raw.profilePicUrl != null ? String(raw.profilePicUrl) : null,
    raw,
  };
}

/** UAZAPI GO v2 — headers `admintoken` (admin) e `token` (instância). */
export class UazapiWhatsAppProvider implements IWhatsAppProvider {
  async listInstances(
    baseUrl: string,
    adminToken: string
  ): Promise<WhatsAppProviderInstanceSnapshot[]> {
    const url = joinApiUrl(baseUrl, "/instance/all");
    const res = await fetch(url, {
      method: "GET",
      headers: { admintoken: adminToken },
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });

    const body = await readBodyJson(res);
    if (!res.ok) {
      const hint =
        typeof body === "string"
          ? body.slice(0, 200)
          : JSON.stringify(body).slice(0, 200);
      throw new Error(
        `Falha ao listar instâncias (${res.status}). Verifique a URL e o token de administrador. ${hint}`
      );
    }

    if (!Array.isArray(body)) {
      throw new Error("Resposta inesperada da API ao listar instâncias.");
    }

    const out: WhatsAppProviderInstanceSnapshot[] = [];
    for (const item of body) {
      const rec = asRecord(item);
      if (!rec) continue;
      const snap = snapshotFromUnknown(rec);
      if (snap.id && snap.token) out.push(snap);
    }
    return out;
  }

  async getInstanceStatus(
    baseUrl: string,
    instanceToken: string
  ): Promise<WhatsAppInstanceStatusResult> {
    const url = joinApiUrl(baseUrl, "/instance/status");
    const res = await fetch(url, {
      method: "GET",
      headers: { token: instanceToken },
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });

    const body = await readBodyJson(res);
    if (!res.ok) {
      const hint =
        typeof body === "string"
          ? body.slice(0, 200)
          : JSON.stringify(body).slice(0, 200);
      throw new Error(`Falha ao consultar status da instância (${res.status}). ${hint}`);
    }

    const root = asRecord(body);
    const instRaw = root?.instance != null ? asRecord(root.instance) : root;
    if (!instRaw || !instRaw.id) {
      throw new Error("Resposta inesperada da API ao consultar status.");
    }

    const statusBlock = root?.status != null ? asRecord(root.status) : undefined;
    const jid =
      statusBlock && "jid" in statusBlock
        ? statusBlock.jid === null || statusBlock.jid === undefined
          ? null
          : String(statusBlock.jid)
        : undefined;

    return {
      instance: snapshotFromUnknown(instRaw),
      statusBlock: statusBlock
        ? {
            connected: Boolean(statusBlock.connected),
            loggedIn: Boolean(statusBlock.loggedIn),
            jid: jid ?? null,
          }
        : undefined,
    };
  }

  async fetchBusinessProfile(
    baseUrl: string,
    instanceToken: string,
    jid: string
  ): Promise<unknown | null> {
    const paths = ["/business/profile", "/profile/business"];
    for (const p of paths) {
      try {
        const url = joinApiUrl(baseUrl, p);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            token: instanceToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jid }),
          cache: "no-store",
          signal: AbortSignal.timeout(30_000),
        });
        const body = await readBodyJson(res);
        if (res.ok) return body;
      } catch {
        // tenta próximo path
      }
    }
    return null;
  }

  async updateInstanceDelaySettings(
    baseUrl: string,
    instanceToken: string,
    msgDelayMin: number,
    msgDelayMax: number,
    _options?: { apiToken?: string }
  ): Promise<void> {
    const min = delaySecondsFromUnknown(msgDelayMin, 0);
    let max = delaySecondsFromUnknown(msgDelayMax, min);
    if (max < min) max = min;

    const url = joinApiUrl(baseUrl, "/instance/updateDelaySettings");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        token: instanceToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msg_delay_min: min,
        msg_delay_max: max,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });

    const body = await readBodyJson(res);
    if (!res.ok) {
      const hint =
        typeof body === "string"
          ? body.slice(0, 200)
          : JSON.stringify(body).slice(0, 200);
      throw new Error(
        `Falha ao configurar delay da fila async (${res.status}). Verifique a instância e o token. ${hint}`
      );
    }
  }

  async sendTextMessage(
    baseUrl: string,
    instanceToken: string,
    params: { number: string; text: string; async?: boolean },
    _options?: { apiToken?: string }
  ): Promise<void> {
    const url = joinApiUrl(baseUrl, "/send/text");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        token: instanceToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: params.number,
        text: params.text,
        async: params.async !== false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });

    const body = await readBodyJson(res);
    if (!res.ok) {
      const hint =
        typeof body === "string"
          ? body.slice(0, 200)
          : JSON.stringify(body).slice(0, 200);
      throw new Error(
        `Falha ao enviar mensagem WhatsApp (${res.status}). Verifique o número e a instância. ${hint}`
      );
    }
  }
}
