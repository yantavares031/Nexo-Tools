import type { ReactNode } from "react";
import { BellRing, Filter, Gauge, Mail, MessageSquare, Plug, Webhook } from "lucide-react";
import { getWebhookConfigAction } from "@/app/actions/webhook-config";
import { listDeskfyImportBoardsAction } from "@/app/actions/deskfy-import-boards";
import { getDeskfyIntegrationPanelAction } from "@/app/actions/deskfy-config";
import { getSmtpConfigPanelAction } from "@/app/actions/smtp-config";
import { getWhatsAppIntegrationPanelAction } from "@/app/actions/whatsapp-integration";
import { getPendingReminderConfigAction } from "@/app/actions/pending-reminders";
import { getCapacityAlertPanelAction } from "@/app/actions/capacity-alerts";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { SemPermissao } from "@/components/SemPermissao";
import { Tabs } from "@/components/ui/tabs";
import type {
  DeskfyIntegrationPanel,
  SmtpConfigPanel,
  WhatsAppIntegrationPanel,
} from "@/types/globals";
import { ConfiguracoesBoardsSection } from "./sub/ConfiguracoesBoardsSection";
import { DeskfyIntegracaoSection } from "./sub/DeskfyIntegracaoSection";
import { SmtpServidorSection } from "./sub/SmtpServidorSection";
import { WebhooksForm } from "./sub/WebhooksForm";
import { WhatsAppIntegracaoSection } from "./sub/WhatsAppIntegracaoSection";
import { LembretesSection } from "./sub/LembretesSection";
import { CapacidadeSection } from "./sub/CapacidadeSection";
import {
  INTEGRACOES_TABS,
  integracoesTabHref,
  integracoesTabSchema,
  type IntegracoesTab,
} from "./sub/tabs";

export const dynamic = "force-dynamic";

const TAB_ICONS: Record<IntegracoesTab, ReactNode> = {
  webhooks: <Webhook aria-hidden />,
  "filtro-boards": <Filter aria-hidden />,
  deskfy: <Plug aria-hidden />,
  smtp: <Mail aria-hidden />,
  whatsapp: <MessageSquare aria-hidden />,
  lembretes: <BellRing aria-hidden />,
  capacidade: <Gauge aria-hidden />,
};

const DEFAULT_SMTP_PANEL: SmtpConfigPanel = {
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "",
  enabled: false,
  hasPassword: false,
  ordemCompraNotifyEmailsText: "",
};

const DEFAULT_DESKFY_PANEL: DeskfyIntegrationPanel = {
  baseUrl: "https://service-api.deskfy.io",
  lookbackDays: 30,
  hasApiKey: false,
};

const DEFAULT_WHATSAPP_PANEL: WhatsAppIntegrationPanel = {
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

async function BoardsTab() {
  const result = await listDeskfyImportBoardsAction();
  return <ConfiguracoesBoardsSection initialBoards={"boards" in result ? result.boards : []} />;
}

async function DeskfyTab() {
  const result = await getDeskfyIntegrationPanelAction();
  return <DeskfyIntegracaoSection initialPanel={"panel" in result ? result.panel : DEFAULT_DESKFY_PANEL} />;
}

async function SmtpTab() {
  const result = await getSmtpConfigPanelAction();
  return <SmtpServidorSection initialPanel={"panel" in result ? result.panel : DEFAULT_SMTP_PANEL} />;
}

async function WhatsAppTab() {
  const result = await getWhatsAppIntegrationPanelAction();
  return <WhatsAppIntegracaoSection initialPanel={"panel" in result ? result.panel : DEFAULT_WHATSAPP_PANEL} />;
}

async function LembretesTab() {
  const result = await getPendingReminderConfigAction();
  if ("error" in result) {
    return <Alert tone="error">{result.error}</Alert>;
  }
  return <LembretesSection initialConfig={result.config} />;
}

async function CapacidadeTab() {
  const result = await getCapacityAlertPanelAction();
  if ("error" in result) {
    return <Alert tone="error">{result.error}</Alert>;
  }
  return <CapacidadeSection initialPanel={result.panel} />;
}

export default async function IntegracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [webhookResult, tab] = await Promise.all([
    getWebhookConfigAction(),
    searchParams.then((query) => integracoesTabSchema.parse(query.tab)),
  ]);

  if ("error" in webhookResult) {
    return (
      <div className="w-full">
        <div className="space-y-6">
          <PageHeader title="Integrações" />
          <SemPermissao />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <PageHeader
          title="Integrações"
          description="Webhooks, Deskfy, e-mail (SMTP), WhatsApp, lembretes e alertas de capacidade usados pelo sistema."
        />
        <Tabs
          label="Seções de integrações"
          items={INTEGRACOES_TABS.map((item) => ({
            label: item.label,
            href: integracoesTabHref(item.value),
            active: item.value === tab,
            icon: TAB_ICONS[item.value],
          }))}
        />

        {tab === "webhooks" && <WebhooksForm initialConfig={webhookResult.config} />}
        {tab === "filtro-boards" && <BoardsTab />}
        {tab === "deskfy" && <DeskfyTab />}
        {tab === "smtp" && <SmtpTab />}
        {tab === "whatsapp" && <WhatsAppTab />}
        {tab === "lembretes" && <LembretesTab />}
        {tab === "capacidade" && <CapacidadeTab />}
      </div>
    </div>
  );
}
