import type { DeskfyTaskDetailsResponse, DeskfyWorkflowReportItem } from "@/types/globals";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import { formatMonthYearDisplay, parseMonthYearToInput } from "@/lib/month-year";

export function parseDeskfyDateToYyyyMm(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const t = dateStr.trim();
  if (!t) return "";

  // Ex.: "14/07/2025"
  const slash = t.split("/");
  if (slash.length === 3 && slash[2].length === 4) {
    const [, mm, yyyy] = slash;
    return `${yyyy}-${mm.padStart(2, "0")}`;
  }

  // Ex.: ISO: "2025-07-14T..."
  const iso = new Date(t);
  if (!Number.isNaN(iso.getTime())) {
    const yyyy = iso.getFullYear();
    const mm = String(iso.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  }

  return parseMonthYearToInput(t) || "";
}

export function parseDeskfyDateToMesDisplay(dateStr: string | null | undefined): string {
  const yyyyMm = parseDeskfyDateToYyyyMm(dateStr);
  if (!yyyyMm) return "—";
  return formatMonthYearDisplay(yyyyMm);
}

export function mapDeskfyWorkflowReportToImportPreviewItems(
  items: DeskfyWorkflowReportItem[]
): DemandaImportadaPreview[] {
  return items.map((item) => {
    const id = String(item.solicitacao.id);
    const codigo = item.solicitacao.codigo ?? "";
    const mesYyyyMm = parseDeskfyDateToYyyyMm(item.solicitacao.dt_cadastro);
    return {
      id,
      codigo,
      demanda: (item.solicitacao.titulo ?? codigo) || "—",
      solicitante: item.solicitante?.name ?? "—",
      status: item.solicitacao.status ?? "—",
      board: item.solicitacao.board ?? "—",
      colunaAtual: item.solicitacao.colunaatual ?? "—",
      valor: "—",
      mes: formatMonthYearDisplay(mesYyyyMm) || "—",
      mesYyyyMm,
    };
  });
}

function getStringField(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveIntegerField(obj: Record<string, unknown>, key: string): number | null {
  const value = obj[key];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value.trim(), 10)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

export function mapDeskfyTaskDetailsToImportPreviewItem(
  data: DeskfyTaskDetailsResponse
): DemandaImportadaPreview {
  const solicitacao =
    data.solicitacao && typeof data.solicitacao === "object" && !Array.isArray(data.solicitacao)
      ? data.solicitacao
      : null;

  if (!solicitacao) {
    throw new Error("Resposta inesperada da Deskfy: dados da solicitação ausentes.");
  }

  const taskId = getPositiveIntegerField(solicitacao, "id");
  if (!taskId) {
    throw new Error("Resposta inesperada da Deskfy: taskId inválido.");
  }

  const codigo = getStringField(solicitacao, "codigo");
  const mesYyyyMm = parseDeskfyDateToYyyyMm(getStringField(solicitacao, "dt_cadastro"));

  return {
    id: String(taskId),
    codigo,
    demanda: getStringField(solicitacao, "titulo") || codigo || `SEB-${taskId}`,
    solicitante: getStringField(solicitacao, "solicitante") || "—",
    status: getStringField(solicitacao, "status") || "—",
    board: getStringField(solicitacao, "board") || "—",
    colunaAtual: getStringField(solicitacao, "colunaatual") || "—",
    valor: "—",
    mes: formatMonthYearDisplay(mesYyyyMm) || "—",
    mesYyyyMm,
  };
}

