import type { DeskfyWorkflowReportQuery, IDeskfyWorkflowReportsService } from "@/lib/domain/deskfy-workflow-reports.service";
import type { DeskfyWorkflowReportItem } from "@/types/globals";

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
}

let instance: IDeskfyWorkflowReportsService | null = null;

export function getDeskfyWorkflowReportsService(): IDeskfyWorkflowReportsService {
  if (instance) return instance;

  const baseUrl = process.env.DESKFY_BASE_URL ?? "https://service-api.deskfy.io";
  const apiKey = process.env.DESKFY_API_KEY ?? "";

  if (!apiKey.trim()) {
    throw new Error("DESKFY_API_KEY não configurado. Preencha no arquivo .env.");
  }

  instance = new FetchDeskfyWorkflowReportsService({ baseUrl, apiKey });
  return instance;
}

