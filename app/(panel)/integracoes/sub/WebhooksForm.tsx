"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { updateWebhookConfigAction, testWebhookAction } from "@/app/actions/webhook-config";
import { toast } from "sonner";
import { Toggle } from "@/components/Toggle";
import type { WebhookConfig, WebhookEventCode, WebhookContact } from "@/types/globals";

const EVENT_OPTIONS: { value: WebhookEventCode; label: string }[] = [
  { value: "demanda.criada", label: "Demanda criada" },
  { value: "demanda.comprovada", label: "Demanda comprovada" },
];

interface WebhooksFormProps {
  initialConfig: WebhookConfig | null;
}

export function WebhooksForm({ initialConfig }: WebhooksFormProps) {
  const [state, formAction] = useActionState(updateWebhookConfigAction, null);
  const [isTesting, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
  const [whatsappMod, setWhatsappMod] = useState(initialConfig?.whatsappMod ?? false);
  const [contactList, setContactList] = useState<WebhookContact[]>(initialConfig?.contactList ?? []);

  useToastOnActionError(state);

  const defaultUrl = initialConfig?.url ?? "";
  const defaultEvents = initialConfig?.events ?? [];

  useEffect(() => {
    if (state && !("error" in state) && Object.keys(state).length === 0) {
      toast.success("Configuração de webhook salva.");
    }
  }, [state]);

  function handleTest() {
    const urlInput = document.getElementById("webhook-url") as HTMLInputElement | null;
    const url = urlInput?.value?.trim() ?? "";
    if (!url) {
      toast.error("Informe a URL do webhook para testar.");
      return;
    }
    startTransition(async () => {
      const result = await testWebhookAction(url);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Webhook testado com sucesso.");
      }
    });
  }

  function addContact() {
    setContactList((prev) => [...prev, { phone: "" }]);
  }

  function updateContact(index: number, field: "phone" | "name", value: string) {
    setContactList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeContact(index: number) {
    setContactList((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="mb-4 text-sm text-slate-600">
        Configure a URL e os eventos que disparam o webhook (método POST). Uma única configuração
        vale para todo o sistema.
      </p>
      <form
        action={formAction}
        onSubmit={(e) => {
          const form = e.currentTarget;
          const events = Array.from(
            form.querySelectorAll<HTMLInputElement>('input[name="event-option"]:checked')
          ).map((el) => el.value) as WebhookEventCode[];
          const hidden = form.querySelector<HTMLInputElement>("#webhook-events-json");
          if (hidden) hidden.value = JSON.stringify(events);
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="webhook-url"
            className="mb-1 block text-sm font-medium text-slate-600"
          >
            URL do webhook
          </label>
          <input
            id="webhook-url"
            name="url"
            type="url"
            defaultValue={defaultUrl}
            placeholder="https://exemplo.com/webhook"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="space-y-1">
          <Toggle
            name="enabled"
            checked={enabled}
            onChange={setEnabled}
            label="Habilitar webhook"
          />
          <p className="text-xs text-slate-500">
            Quando desligado, nenhum evento será disparado.
          </p>
        </div>

        <div className="space-y-1">
          <Toggle
            name="whatsappMod"
            checked={whatsappMod}
            onChange={setWhatsappMod}
            label="Modo WhatsApp"
          />
          <p className="text-xs text-slate-500">
            Quando ligado, a lista de contatos será enviada como contact_list no body de todo evento.
          </p>
        </div>

        {whatsappMod && (
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Lista de contatos
            </span>
            <div className="flex flex-col gap-2">
              {contactList.map((contact, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2"
                >
                  <input
                    type="text"
                    placeholder="Telefone"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, "phone", e.target.value)}
                    className="w-32 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    placeholder="Nome (opcional)"
                    value={contact.name ?? ""}
                    onChange={(e) => updateContact(index, "name", e.target.value)}
                    className="min-w-32 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addContact}
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Adicionar contato
              </button>
            </div>
            <input type="hidden" name="contactList" value={JSON.stringify(contactList)} />
          </div>
        )}

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Eventos que disparam o webhook
          </span>
          <div className="flex flex-col gap-2">
            {EVENT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="event-option"
                  value={opt.value}
                  defaultChecked={defaultEvents.includes(opt.value)}
                  className="size-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                />
                <span className="text-sm text-slate-800">{opt.label}</span>
              </label>
            ))}
          </div>
          <input type="hidden" name="events" id="webhook-events-json" value="" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isTesting ? "Testando..." : "Testar"}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
