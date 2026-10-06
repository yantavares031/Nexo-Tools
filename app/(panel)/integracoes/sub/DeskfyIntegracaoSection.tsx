"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Check, Globe, Info, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { saveDeskfyIntegrationSettingsAction } from "@/app/actions/deskfy-config";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/panel-header";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { AlterarDeskfyApiKeyModal } from "@/modals/AlterarDeskfyApiKeyModal";
import type { DeskfyIntegrationPanel } from "@/types/globals";

const MASKED_KEY = "***************";

interface DeskfyIntegracaoSectionProps {
  initialPanel: DeskfyIntegrationPanel;
}

export function DeskfyIntegracaoSection({ initialPanel }: DeskfyIntegracaoSectionProps) {
  const router = useRouter();
  const [state, formAction, isPendingSave] = useActionState(saveDeskfyIntegrationSettingsAction, null);
  const [lookbackDays, setLookbackDays] = useState(initialPanel.lookbackDays);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  useToastOnActionError(state);

  useEffect(() => {
    setLookbackDays(initialPanel.lookbackDays);
  }, [initialPanel.lookbackDays]);

  useEffect(() => {
    if (state && !("error" in state) && Object.keys(state).length === 0) {
      toast.success("Configuração Deskfy salva.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="max-w-3xl">
      <form action={formAction}>
        <PanelHeader
          title="Deskfy"
          description="URL da API, chave de acesso e intervalo usados na importação de demandas."
          actions={
            <Button type="submit" loading={isPendingSave}>
              {!isPendingSave && <Check className="size-4" strokeWidth={2.25} aria-hidden />}
              {isPendingSave ? "Salvando..." : "Salvar configurações"}
            </Button>
          }
        />

        <Callout icon={<Info aria-hidden />} title="Onde a chave fica salva" className="mb-7">
          A chave fica apenas no banco de dados. As variáveis DESKFY_* do ambiente ainda funcionam como
          alternativa até você cadastrar aqui.
        </Callout>

        <fieldset disabled={isPendingSave}>
          <FormSection icon={<Globe aria-hidden />} title="Conexão" description="Endereço da API da Deskfy.">
            <FormField id="deskfy-base-url" label="URL base da API">
              <Input
                id="deskfy-base-url"
                name="baseUrl"
                type="url"
                defaultValue={initialPanel.baseUrl}
                placeholder="https://service-api.deskfy.io"
              />
            </FormField>
          </FormSection>

          <FormSection
            icon={<KeyRound aria-hidden />}
            title="Chave de API"
            description="Enviada no cabeçalho x-api-key."
          >
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="text"
                readOnly
                value={initialPanel.hasApiKey ? MASKED_KEY : ""}
                placeholder={initialPanel.hasApiKey ? undefined : "Nenhuma chave cadastrada"}
                className="w-auto min-w-[200px] flex-1 bg-neutral-50"
                aria-label="Chave API (oculta)"
              />
              <Button type="button" variant="outline" className="h-10" onClick={() => setKeyModalOpen(true)}>
                {initialPanel.hasApiKey ? "Alterar chave" : "Cadastrar chave"}
              </Button>
            </div>
          </FormSection>

          <FormSection
            icon={<CalendarRange aria-hidden />}
            title="Intervalo da importação"
            description="O relatório usa de (hoje − N dias) até amanhã. Mínimo 0, máximo 500."
          >
            <div className="space-y-3">
              <label htmlFor="deskfy-lookback" className="block text-[13px] text-neutral-700">
                Dias retroativos a partir de hoje:{" "}
                <span className="font-medium text-neutral-950 tabular-nums">{lookbackDays}</span>
              </label>
              <input
                id="deskfy-lookback"
                type="range"
                min={0}
                max={500}
                step={1}
                value={lookbackDays}
                onChange={(e) => setLookbackDays(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-blue-600 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
                aria-valuemin={0}
                aria-valuemax={500}
                aria-valuenow={lookbackDays}
              />
              <input type="hidden" name="lookbackDays" value={lookbackDays} />
            </div>
          </FormSection>
        </fieldset>
      </form>

      <AlterarDeskfyApiKeyModal open={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </div>
  );
}
