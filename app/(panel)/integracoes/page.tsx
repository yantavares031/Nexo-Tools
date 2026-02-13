import { getWebhookConfigAction } from "@/app/actions/webhook-config";
import { SemPermissao } from "@/components/SemPermissao";
import { IntegracoesTabs } from "./sub/IntegracoesTabs";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const webhookResult = await getWebhookConfigAction();

  if ("error" in webhookResult) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-800">Integrações</h1>
        <SemPermissao />
      </div>
    );
  }

  const initialWebhookConfig = webhookResult.config;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-xl font-semibold text-slate-800">Integrações</h1>
        <IntegracoesTabs initialWebhookConfig={initialWebhookConfig} />
      </div>
    </div>
  );
}
