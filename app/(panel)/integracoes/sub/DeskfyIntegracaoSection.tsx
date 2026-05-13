"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plug } from "lucide-react";
import { toast } from "sonner";
import { saveDeskfyIntegrationSettingsAction } from "@/app/actions/deskfy-config";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
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
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-800">
        <Plug className="size-5 shrink-0" aria-hidden />
        Deskfy
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        URL da API e intervalo usados na importação de demandas. A chave fica apenas no banco de dados;
        variáveis DESKFY_* no ambiente ainda funcionam como alternativa até você cadastrar aqui.
      </p>

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="deskfy-base-url" className="mb-1 block text-sm font-medium text-slate-600">
            URL base da API
          </label>
          <input
            id="deskfy-base-url"
            name="baseUrl"
            type="url"
            defaultValue={initialPanel.baseUrl}
            placeholder="https://service-api.deskfy.io"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="deskfy-lookback" className="mb-1 block text-sm font-medium text-slate-600">
            Intervalo da importação (dias retroativos a partir de hoje): {lookbackDays}
          </label>
          <p className="mb-2 text-xs text-slate-500">
            O relatório usa de (hoje − N dias) até amanhã. Mínimo 0, máximo 500.
          </p>
          <input
            id="deskfy-lookback"
            type="range"
            min={0}
            max={500}
            step={1}
            value={lookbackDays}
            onChange={(e) => setLookbackDays(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
            aria-valuemin={0}
            aria-valuemax={500}
            aria-valuenow={lookbackDays}
          />
          <input type="hidden" name="lookbackDays" value={lookbackDays} />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-600">Chave API (x-api-key)</span>
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="text"
              readOnly
              value={initialPanel.hasApiKey ? MASKED_KEY : ""}
              placeholder={initialPanel.hasApiKey ? undefined : "Nenhuma chave cadastrada"}
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800"
              aria-label="Chave API (oculta)"
            />
            <button
              type="button"
              onClick={() => setKeyModalOpen(true)}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {initialPanel.hasApiKey ? "Alterar chave" : "Cadastrar chave"}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <FormActionSubmitButton pending={isPendingSave} pendingLabel="Salvando...">
            Salvar configurações
          </FormActionSubmitButton>
        </div>
      </form>

      <AlterarDeskfyApiKeyModal open={keyModalOpen} onClose={() => setKeyModalOpen(false)} />
    </div>
  );
}
