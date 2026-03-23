"use client";

import { Tab } from "@/components/Tab";
import { WebhooksForm } from "./WebhooksForm";
import { ConfiguracoesBoardsSection } from "./ConfiguracoesBoardsSection";
import type { WebhookConfig } from "@/types/globals";

interface DeskfyImportBoard {
  id: string;
  nome: string;
}

interface IntegracoesTabsProps {
  initialWebhookConfig?: WebhookConfig | null;
  initialBoards?: DeskfyImportBoard[];
}

export function IntegracoesTabs({
  initialWebhookConfig = null,
  initialBoards = [],
}: IntegracoesTabsProps) {
  return (
    <Tab defaultTab="webhooks">
      <Tab.List>
        <Tab.Item id="webhooks">Webhooks</Tab.Item>
        <Tab.Item id="configuracoes">Configurações</Tab.Item>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel id="webhooks">
          <WebhooksForm initialConfig={initialWebhookConfig} />
        </Tab.Panel>
        <Tab.Panel id="configuracoes">
          <ConfiguracoesBoardsSection initialBoards={initialBoards} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab>
  );
}
