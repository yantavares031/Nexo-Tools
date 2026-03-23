import type { DeskfyWorkflowReportItem } from "@/types/globals";

export type DeskfyWorkflowReportQuery = {
  initialDate: string;
  endDate: string;
  briefingId?: number;
  boardName?: string;
  columnName?: string;
  /** Quando true, gerar URL publica para anexos (validade curta). */
  generateAttachmentPublicUrl?: boolean;
};

/** Contrato para consultar relatórios de solicitações por workflow na Deskfy. */
export interface IDeskfyWorkflowReportsService {
  getWorkflowReport(query: DeskfyWorkflowReportQuery): Promise<DeskfyWorkflowReportItem[]>;
}

