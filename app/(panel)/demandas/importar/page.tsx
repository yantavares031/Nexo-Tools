import { getSession } from "@/lib/auth";
import { getDeskfyWorkflowReportsService } from "@/lib/infra/deskfy-workflow-reports.service";
import { getDemandasFilterOptionsUseCase } from "@/lib/use-cases/get-demandas-filter-options.use-case";
import {
  getDemandaRepository,
  getSolicitanteRepository,
  getAgenciaRepository,
  getDeskfyImportBoardRepository,
  getDeskfyConfigRepository,
} from "@/lib/repositories";
import { getDeskfyWorkflowImportPreviewUseCase } from "@/lib/use-cases/get-deskfy-workflow-import-preview.use-case";
import { getDeskfyWorkflowImportDateRangeUseCase } from "@/lib/use-cases/get-deskfy-workflow-import-date-range.use-case";
import { SemPermissao } from "@/components/SemPermissao";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImportacaoDemandasClient } from "./sub/ImportacaoDemandasClient";
import { ImportacaoSearchParamsToaster } from "./sub/ImportacaoSearchParamsToaster";

export const dynamic = "force-dynamic";

async function fetchDeskfyImportPreview(): Promise<DemandaImportadaPreview[]> {
  const deskfyConfigRepository = getDeskfyConfigRepository();
  const { initialDate, endDate } = await getDeskfyWorkflowImportDateRangeUseCase({
    deskfyConfigRepository,
  });
  const deskfyWorkflowReportsService = await getDeskfyWorkflowReportsService();
  return getDeskfyWorkflowImportPreviewUseCase(
    {
      initialDate,
      endDate,
      generateAttachmentPublicUrl: false,
    },
    {
      deskfyWorkflowReportsService,
      deskfyImportBoardRepository: getDeskfyImportBoardRepository(),
      demandaRepository: getDemandaRepository(),
    }
  );
}

export default async function ImportacaoDemandasPage() {
  const session = await getSession();
  if (!session || session.role === "agency") {
    return (
      <div className="p-6">
        <SemPermissao />
      </div>
    );
  }

  let previewItems: DemandaImportadaPreview[] = [];
  let errorMessage: string | null = null;

  const demandaRepository = getDemandaRepository();
  const solicitanteRepository = getSolicitanteRepository();
  const agenciaRepository = getAgenciaRepository();

  const boardRepository = getDeskfyImportBoardRepository();

  const [previewResult, filterOptions] = await Promise.all([
    (async () => {
      try {
        return await fetchDeskfyImportPreview();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao carregar relatório Deskfy.";
        errorMessage = msg;
        console.error("[Importar] Deskfy error:", msg, err instanceof Error ? err.stack : "");
        return [];
      }
    })(),
    getDemandasFilterOptionsUseCase(undefined, {
      demandaRepository,
      solicitanteRepository,
      agenciaRepository,
      deskfyImportBoardRepository: boardRepository,
    }),
  ]);

  previewItems = previewResult;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
              <img
                src="https://assets.apidog.com/app/apidoc-image/custom/20260128/04d71c0d-c184-4e56-92f3-822cbc2dc447.png"
                alt="Deskfy"
                className="size-5 shrink-0 rounded object-cover"
              />
              Importação de demandas Deskfy
            </h1>
            <p className="text-sm text-slate-500">
              Esta pagina vai receber demandas vindas de outro sistema. Em seguida, voce podera revisar e importar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="size-4" />
              Voltar para demandas
            </Link>
          </div>
        </div>

        <div className="space-y-1 text-sm text-slate-600">
          <p>
            Mostrando solicitações na coluna{" "}
            <span className="font-semibold">Entregue</span> dos boards permitidos que ainda não
            constam no cadastro (mesmo OC/PI / código SEB da Deskfy). Configure os boards em
            Integrações → Configurações.
          </p>
        </div>

        <ImportacaoSearchParamsToaster />

        {errorMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
            {errorMessage}
          </div>
        ) : null}

        <ImportacaoDemandasClient items={previewItems} options={filterOptions} />
        </div>
    </div>
  );
}
