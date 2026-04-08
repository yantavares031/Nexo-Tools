import { getWebhookConfigAction } from "@/app/actions/webhook-config";
import { listDeskfyImportBoardsAction } from "@/app/actions/deskfy-import-boards";
import { getSmtpConfigPanelAction } from "@/app/actions/smtp-config";
import { SemPermissao } from "@/components/SemPermissao";
import { IntegracoesTabs } from "./sub/IntegracoesTabs";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const [webhookResult, boardsResult, smtpResult] = await Promise.all([
    getWebhookConfigAction(),
    listDeskfyImportBoardsAction(),
    getSmtpConfigPanelAction(),
  ]);

  if ("error" in webhookResult) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-800">Integrações</h1>
        <SemPermissao />
      </div>
    );
  }

  const initialWebhookConfig = webhookResult.config;
  const initialBoards = "boards" in boardsResult ? boardsResult.boards : [];
  const initialSmtpPanel =
    "panel" in smtpResult
      ? smtpResult.panel
      : {
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpUser: "",
          enabled: false,
          hasPassword: false,
        };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Integrações</h1>
        <IntegracoesTabs
          initialWebhookConfig={initialWebhookConfig}
          initialBoards={initialBoards}
          initialSmtpPanel={initialSmtpPanel}
        />
      </div>
    </div>
  );
}
