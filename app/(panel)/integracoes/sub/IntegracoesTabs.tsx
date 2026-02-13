"use client";

import { Tab } from "@/components/Tab";
import { WebhooksForm } from "./WebhooksForm";
import type { WebhookConfig } from "@/types/globals";

interface IntegracoesTabsProps {
  initialWebhookConfig?: WebhookConfig | null;
}

export function IntegracoesTabs({ initialWebhookConfig = null }: IntegracoesTabsProps) {
  return (
    <Tab defaultTab="webhooks">
      <Tab.List>
        <Tab.Item id="webhooks">Webhooks</Tab.Item>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel id="webhooks">
          <WebhooksForm initialConfig={initialWebhookConfig} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab>
  );
}
