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
import { normalizeDeskfyUserMessage } from "@/lib/deskfy/deskfy-user-message";
import { SemPermissao } from "@/components/SemPermissao";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import Link from "next/link";
import { Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Callout } from "@/components/ui/callout";
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
      <div className="w-full">
        <SemPermissao />
      </div>
    );
  }

  const demandaRepository = getDemandaRepository();
  const solicitanteRepository = getSolicitanteRepository();
  const agenciaRepository = getAgenciaRepository();

  const boardRepository = getDeskfyImportBoardRepository();

  const [{ previewItems, errorMessage }, filterOptions] = await Promise.all([
    (async () => {
      try {
        return {
          previewItems: await fetchDeskfyImportPreview(),
          errorMessage: null,
        };
      } catch (err) {
        const rawMsg = err instanceof Error ? err.message : "Erro ao carregar relatório Deskfy.";
        const userMessage = normalizeDeskfyUserMessage(err, {
          fallback: "Erro de servidor ao carregar a importação da Deskfy.",
        });
        console.error("[Importar] Deskfy error:", rawMsg, err instanceof Error ? err.stack : "");
        return {
          previewItems: [],
          errorMessage: userMessage,
        };
      }
    })(),
    getDemandasFilterOptionsUseCase(undefined, {
      demandaRepository,
      solicitanteRepository,
      agenciaRepository,
      deskfyImportBoardRepository: boardRepository,
    }),
  ]);

  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Demandas"
          backHref="/"
          title="Importar da Deskfy"
          leading={
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="https://assets.apidog.com/app/apidoc-image/custom/20260128/04d71c0d-c184-4e56-92f3-822cbc2dc447.png"
              alt="Deskfy"
              className="size-5 shrink-0 rounded object-cover"
            />
          }
          description="Revise as solicitações vindas da Deskfy ou busque uma específica pelo código SEB para importar."
        />

        <Callout icon={<Info aria-hidden />} title="Solicitações na coluna Entregue">
          Aparecem aqui as solicitações dos boards permitidos que ainda não constam no cadastro (mesmo OC/PI /
          código SEB da Deskfy). Configure os boards em{" "}
          <Link href="/integracoes" className="text-link hover:text-link-hover">
            Integrações → Configurações
          </Link>
          .
        </Callout>

        <ImportacaoSearchParamsToaster />

        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

        <ImportacaoDemandasClient items={previewItems} options={filterOptions} />
      </div>
    </div>
  );
}
