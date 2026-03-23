import type { DeskfyWorkflowReportItem } from "@/types/globals";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import { formatMonthYearDisplay, parseMonthYearToInput } from "@/lib/month-year";

function parseDeskfyDateToYyyyMm(dateStr: string | null | undefined): string {
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

