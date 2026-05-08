"use client";

import { Tab } from "@/components/Tab";
import { WebhooksForm } from "./WebhooksForm";
import { ConfiguracoesBoardsSection } from "./ConfiguracoesBoardsSection";
import { SmtpServidorSection } from "./SmtpServidorSection";
import { DeskfyIntegracaoSection } from "./DeskfyIntegracaoSection";
import { WhatsAppIntegracaoSection } from "./WhatsAppIntegracaoSection";
import type {
  WebhookConfig,
  SmtpConfigPanel,
  DeskfyIntegrationPanel,
  WhatsAppIntegrationPanel,
} from "@/types/globals";

interface DeskfyImportBoard {
  id: string;
  nome: string;
}

interface IntegracoesTabsProps {
  initialWebhookConfig?: WebhookConfig | null;
  initialBoards?: DeskfyImportBoard[];
  initialSmtpPanel: SmtpConfigPanel;
  initialDeskfyPanel: DeskfyIntegrationPanel;
  initialWhatsAppPanel: WhatsAppIntegrationPanel;
}

export function IntegracoesTabs({
  initialWebhookConfig = null,
  initialBoards = [],
  initialSmtpPanel,
  initialDeskfyPanel,
  initialWhatsAppPanel,
}: IntegracoesTabsProps) {
  return (
    <Tab defaultTab="webhooks">
      <Tab.List>
        <Tab.Item id="webhooks">Webhooks</Tab.Item>
        <Tab.Item id="filtro-boards">Filtro de Boards</Tab.Item>
        <Tab.Item id="deskfy">Deskfy</Tab.Item>
        <Tab.Item id="smtp">Servidor SMTP</Tab.Item>
        <Tab.Item id="whatsapp">WhatsApp</Tab.Item>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel id="webhooks">
          <WebhooksForm initialConfig={initialWebhookConfig} />
        </Tab.Panel>
        <Tab.Panel id="filtro-boards">
          <ConfiguracoesBoardsSection initialBoards={initialBoards} />
        </Tab.Panel>
        <Tab.Panel id="deskfy">
          <DeskfyIntegracaoSection initialPanel={initialDeskfyPanel} />
        </Tab.Panel>
        <Tab.Panel id="smtp">
          <SmtpServidorSection initialPanel={initialSmtpPanel} />
        </Tab.Panel>
        <Tab.Panel id="whatsapp">
          <WhatsAppIntegracaoSection initialPanel={initialWhatsAppPanel} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab>
  );
}
