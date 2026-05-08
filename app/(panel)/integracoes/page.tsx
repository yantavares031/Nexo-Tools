import { getWebhookConfigAction } from "@/app/actions/webhook-config";
import { listDeskfyImportBoardsAction } from "@/app/actions/deskfy-import-boards";
import { getDeskfyIntegrationPanelAction } from "@/app/actions/deskfy-config";
import { getSmtpConfigPanelAction } from "@/app/actions/smtp-config";
import { getWhatsAppIntegrationPanelAction } from "@/app/actions/whatsapp-integration";
import { SemPermissao } from "@/components/SemPermissao";
import { IntegracoesTabs } from "./sub/IntegracoesTabs";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const [webhookResult, boardsResult, smtpResult, deskfyResult, whatsappResult] = await Promise.all([
    getWebhookConfigAction(),
    listDeskfyImportBoardsAction(),
    getSmtpConfigPanelAction(),
    getDeskfyIntegrationPanelAction(),
    getWhatsAppIntegrationPanelAction(),
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
          ordemCompraNotifyEmailsText: "",
        };

  const initialDeskfyPanel =
    "panel" in deskfyResult
      ? deskfyResult.panel
      : {
          baseUrl: "https://service-api.deskfy.io",
          lookbackDays: 30,
          hasApiKey: false,
        };

  const initialWhatsAppPanel =
    "panel" in whatsappResult
      ? whatsappResult.panel
      : {
          platform: "uazapi",
          baseUrl: "",
          zapiInstanceId: "",
          evolutionInstanceName: "",
          hasAdminToken: false,
          hasApiToken: false,
          hasInstanceToken: false,
          selectedInstanceId: null,
          instanceName: null,
          instanceStatus: null,
          profileName: null,
          profilePicSrc: null,
          businessProfileSummary: null,
          notifyRecipients: [],
          asyncMsgDelayMin: 3,
          asyncMsgDelayMax: 5,
        };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Integrações</h1>
        <IntegracoesTabs
          initialWebhookConfig={initialWebhookConfig}
          initialBoards={initialBoards}
          initialSmtpPanel={initialSmtpPanel}
          initialDeskfyPanel={initialDeskfyPanel}
          initialWhatsAppPanel={initialWhatsAppPanel}
        />
      </div>
    </div>
  );
}
