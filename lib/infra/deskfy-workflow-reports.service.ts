import type {
  DeskfyTaskDetailsQuery,
  DeskfyWorkflowReportQuery,
  IDeskfyWorkflowReportsService,
} from "@/lib/domain/deskfy-workflow-reports.service";
import { getDeskfyConfigRepository } from "@/lib/repositories";
import type { DeskfyTaskDetailsResponse, DeskfyWorkflowReportItem } from "@/types/globals";

const DEFAULT_BASE_URL = "https://service-api.deskfy.io";

export class FetchDeskfyWorkflowReportsService implements IDeskfyWorkflowReportsService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(deps: { baseUrl: string; apiKey: string }) {
    this.baseUrl = deps.baseUrl;
    this.apiKey = deps.apiKey;
  }

  async getWorkflowReport(query: DeskfyWorkflowReportQuery): Promise<DeskfyWorkflowReportItem[]> {
    const url = new URL("/v1/reports/workflow", this.baseUrl);

    url.searchParams.set("initialDate", query.initialDate);
    url.searchParams.set("endDate", query.endDate);
    if (query.briefingId !== undefined) url.searchParams.set("briefingId", String(query.briefingId));
    if (query.boardName) url.searchParams.set("boardName", query.boardName);
    if (query.columnName) url.searchParams.set("columnName", query.columnName);

    if (query.generateAttachmentPublicUrl !== undefined) {
      url.searchParams.set("generateAttachmentPublicUrl", query.generateAttachmentPublicUrl ? "true" : "false");
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchErr) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[Deskfy] Fetch failed (network/timeout):", url.toString(), errMsg);
      throw fetchErr;
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const errMsg = `Deskfy ${res.status} ${res.statusText}${bodyText ? `: ${bodyText}` : ""}`.trim();
      console.error("[Deskfy] Request failed:", url.toString(), res.status, bodyText || "(no body)");
      throw new Error(errMsg);
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      throw new Error("Resposta inesperada da Deskfy: esperado um array.");
    }

    return data as DeskfyWorkflowReportItem[];
  }

  async getTaskDetails(taskId: number, query?: DeskfyTaskDetailsQuery): Promise<DeskfyTaskDetailsResponse> {
    const url = new URL("/v1/reports/workflow/task-details", this.baseUrl);
    url.searchParams.set("taskId", String(taskId));
    if (query?.generateAttachmentPublicUrl !== undefined) {
      url.searchParams.set("generateAttachmentPublicUrl", query.generateAttachmentPublicUrl ? "true" : "false");
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchErr) {
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[Deskfy] task-details fetch failed:", url.toString(), errMsg);
      throw fetchErr;
    }

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const errMsg = `Deskfy ${res.status} ${res.statusText}${bodyText ? `: ${bodyText}` : ""}`.trim();
      console.error("[Deskfy] task-details failed:", url.toString(), res.status, bodyText || "(no body)");
      throw new Error(errMsg);
    }

    const data = (await res.json()) as unknown;
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Resposta inesperada da Deskfy: task-details deve ser um objeto.");
    }

    return data as DeskfyTaskDetailsResponse;
  }
}

/**
 * Credenciais da Deskfy: preferência para valores salvos em Integrações;
 * fallback para DESKFY_BASE_URL / DESKFY_API_KEY no ambiente (migração).
 */
export async function getDeskfyWorkflowReportsService(): Promise<IDeskfyWorkflowReportsService> {
  const repo = getDeskfyConfigRepository();
  const row = await repo.get();

  const baseUrlRaw =
    row?.baseUrl?.trim() || process.env.DESKFY_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const baseUrl = baseUrlRaw.replace(/\/$/, "");

  const apiKey = row?.apiKey?.trim() || process.env.DESKFY_API_KEY?.trim() || "";

  if (!apiKey) {
    throw new Error(
      "Chave API Deskfy não configurada. Cadastre em Integrações → Deskfy ou defina DESKFY_API_KEY no ambiente."
    );
  }

  return new FetchDeskfyWorkflowReportsService({ baseUrl, apiKey });
}

