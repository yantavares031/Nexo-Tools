"use client";

import { Tab } from "@/components/Tab";
import { WebhooksForm } from "./WebhooksForm";
import { ConfiguracoesBoardsSection } from "./ConfiguracoesBoardsSection";
import { SmtpServidorSection } from "./SmtpServidorSection";
import type { WebhookConfig, SmtpConfigPanel } from "@/types/globals";

interface DeskfyImportBoard {
  id: string;
  nome: string;
}

interface IntegracoesTabsProps {
  initialWebhookConfig?: WebhookConfig | null;
  initialBoards?: DeskfyImportBoard[];
  initialSmtpPanel: SmtpConfigPanel;
}

export function IntegracoesTabs({
  initialWebhookConfig = null,
  initialBoards = [],
  initialSmtpPanel,
}: IntegracoesTabsProps) {
  return (
    <Tab defaultTab="webhooks">
      <Tab.List>
        <Tab.Item id="webhooks">Webhooks</Tab.Item>
        <Tab.Item id="filtro-boards">Filtro de Boards</Tab.Item>
        <Tab.Item id="smtp">Servidor SMTP</Tab.Item>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel id="webhooks">
          <WebhooksForm initialConfig={initialWebhookConfig} />
        </Tab.Panel>
        <Tab.Panel id="filtro-boards">
          <ConfiguracoesBoardsSection initialBoards={initialBoards} />
        </Tab.Panel>
        <Tab.Panel id="smtp">
          <SmtpServidorSection initialPanel={initialSmtpPanel} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab>
  );
}
