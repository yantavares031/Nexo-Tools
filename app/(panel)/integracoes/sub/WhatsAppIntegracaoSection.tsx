"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import {
  connectWhatsAppIntegrationAction,
  disconnectWhatsAppIntegrationAction,
  pollWhatsAppInstanceStatusAction,
  saveWhatsAppAsyncDelaySettingsAction,
  saveWhatsAppNotifyRecipientsAction,
  selectWhatsAppInstanceAction,
} from "@/app/actions/whatsapp-integration";
import { FormActionSubmitButton } from "@/components/FormActionSubmitButton";
import { useConfirm } from "@/lib/confirm-context";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import type {
  WhatsAppInstanceListItem,
  WhatsAppInstanceStatusPayload,
  WhatsAppIntegrationPanel,
} from "@/types/globals";
import {
  type WhatsAppPlatformChoice,
  WHATSAPP_PLATFORMS,
  normalizeWhatsAppPlatformId,
  isWhatsAppUazapiPlatform,
} from "@/lib/whatsapp-platform";

interface WhatsAppIntegracaoSectionProps {
  initialPanel: WhatsAppIntegrationPanel;
}

const PLATFORM_LABEL: Record<WhatsAppPlatformChoice, string> = {
  uazapi: "UAZAPI",
  "z-api": "Z-API",
  evolution: "Evolution",
};

function WhatsAppStatusWord({ value }: { value: string | null | undefined }) {
  const text = value?.trim();
  if (!text) return <span className="text-slate-800">—</span>;
  const isConnected = text.toLowerCase() === "connected";
  return (
    <span className={isConnected ? "font-medium text-emerald-600" : "text-slate-800"}>{text}</span>
  );
}

export function WhatsAppIntegracaoSection({ initialPanel }: WhatsAppIntegracaoSectionProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [connectPending, startConnect] = useTransition();
  const [selectPending, startSelect] = useTransition();
  const [disconnectPending, startDisconnect] = useTransition();
  const [saveDelayState, saveDelayAction, saveDelayPending] = useActionState(
    saveWhatsAppAsyncDelaySettingsAction,
    null
  );
  const [saveRecipientsState, saveRecipientsAction, saveRecipientsPending] = useActionState(
    saveWhatsAppNotifyRecipientsAction,
    null
  );
  const [instances, setInstances] = useState<WhatsAppInstanceListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [pollPayload, setPollPayload] = useState<WhatsAppInstanceStatusPayload | null>(null);
  const [platform, setPlatform] = useState<WhatsAppPlatformChoice>(() =>
    normalizeWhatsAppPlatformId(initialPanel.platform)
  );
  const [notifyRecipients, setNotifyRecipients] = useState<string[]>(() => [
    ...initialPanel.notifyRecipients,
  ]);
  const [recipientInput, setRecipientInput] = useState("");
  const [delayMinStr, setDelayMinStr] = useState(() => String(initialPanel.asyncMsgDelayMin));
  const [delayMaxStr, setDelayMaxStr] = useState(() => String(initialPanel.asyncMsgDelayMax));

  useToastOnActionError(saveDelayState);
  useToastOnActionError(saveRecipientsState);

  useEffect(() => {
    setPlatform(normalizeWhatsAppPlatformId(initialPanel.platform));
  }, [initialPanel.platform]);

  useEffect(() => {
    setNotifyRecipients([...initialPanel.notifyRecipients]);
  }, [initialPanel.notifyRecipients]);

  useEffect(() => {
    setDelayMinStr(String(initialPanel.asyncMsgDelayMin));
    setDelayMaxStr(String(initialPanel.asyncMsgDelayMax));
  }, [initialPanel.asyncMsgDelayMin, initialPanel.asyncMsgDelayMax]);

  useEffect(() => {
    if (
      saveDelayState &&
      !("error" in saveDelayState) &&
      typeof saveDelayState === "object" &&
      Object.keys(saveDelayState).length === 0
    ) {
      const uazapi = isWhatsAppUazapiPlatform(initialPanel.platform);
      toast.success(
        uazapi && initialPanel.hasInstanceToken
          ? "Delay da fila async salvo e aplicado na API."
          : "Delay da fila async salvo."
      );
      router.refresh();
    }
  }, [saveDelayState, router, initialPanel.platform, initialPanel.hasInstanceToken]);

  useEffect(() => {
    if (
      saveRecipientsState &&
      !("error" in saveRecipientsState) &&
      Object.keys(saveRecipientsState).length === 0
    ) {
      toast.success("Receptores salvos.");
      router.refresh();
    }
  }, [saveRecipientsState, router]);

  const hasSavedInstance = Boolean(
    initialPanel.selectedInstanceId?.trim() && initialPanel.hasInstanceToken
  );
  const panelIsUazapi = isWhatsAppUazapiPlatform(initialPanel.platform);

  function handleConnectSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submittedPlatform = normalizeWhatsAppPlatformId(String(fd.get("platform") ?? "uazapi"));
    startConnect(async () => {
      const result = await connectWhatsAppIntegrationAction(null, fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setInstances(result.instances);
      if (submittedPlatform === "uazapi") {
        toast.success(
          result.instances.length === 0
            ? "Conectado. Nenhuma instância retornada."
            : `${result.instances.length} instância(ões) encontrada(s).`
        );
      } else {
        toast.success("Credenciais salvas.");
      }
    });
  }

  function handleSelectSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedId.trim()) {
      toast.error("Selecione uma instância na tabela.");
      return;
    }
    const fd = new FormData();
    fd.set("instanceId", selectedId.trim());
    startSelect(async () => {
      const result = await selectWhatsAppInstanceAction(null, fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Instância WhatsApp salva.");
      setInstances([]);
      setSelectedId("");
      router.refresh();
    });
  }

  async function handleDisconnect() {
    const ok = await confirm({
      title: "Desconectar WhatsApp",
      message:
        "A instância será removida deste painel. URL e tokens da API continuam salvos para reconectar.",
      confirmLabel: "Desconectar",
      variant: "danger",
    });
    if (!ok) return;
    startDisconnect(async () => {
      const result = await disconnectWhatsAppIntegrationAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("WhatsApp desconectado.");
      router.refresh();
    });
  }

  useEffect(() => {
    if (!hasSavedInstance || !panelIsUazapi) {
      return;
    }

    let cancelled = false;

    async function tick() {
      const res = await pollWhatsAppInstanceStatusAction();
      if (cancelled) return;
      if ("error" in res) {
        setPollPayload(null);
        return;
      }
      setPollPayload(res.payload);
    }

    void tick();
    const id = window.setInterval(() => void tick(), 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hasSavedInstance, panelIsUazapi]);

  return (
    <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <MessageSquare className="size-5 shrink-0" aria-hidden />
          WhatsApp
        </h2>
        {hasSavedInstance ? (
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={disconnectPending}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
          >
            {disconnectPending ? "Desconectando…" : "Desconectar"}
          </button>
        ) : null}
      </div>

      {!hasSavedInstance ? (
        <>
      <form onSubmit={handleConnectSubmit} className="space-y-4">
        <div>
          <label htmlFor="wa-platform" className="mb-1 block text-sm font-medium text-slate-600">
            Plataforma
          </label>
          <select
            id="wa-platform"
            name="platform"
            value={platform}
            onChange={(e) => setPlatform(normalizeWhatsAppPlatformId(e.target.value))}
            disabled={connectPending}
            className="w-full max-w-md rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
          >
            {WHATSAPP_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        {platform === "uazapi" && (
          <>
            <div>
              <label htmlFor="wa-base-url" className="mb-1 block text-sm font-medium text-slate-600">
                URL base da API
              </label>
              <input
                id="wa-base-url"
                name="baseUrl"
                type="url"
                required
                defaultValue={initialPanel.baseUrl}
                placeholder="https://…"
                disabled={connectPending}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="wa-admin-token" className="mb-1 block text-sm font-medium text-slate-600">
                Token administrador (admintoken)
              </label>
              <input
                id="wa-admin-token"
                name="adminToken"
                type="password"
                autoComplete="new-password"
                placeholder={
                  initialPanel.hasAdminToken ? "Em branco mantém o salvo" : "Obrigatório"
                }
                disabled={connectPending}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="wa-api-token" className="mb-1 block text-sm font-medium text-slate-600">
                Token adicional (opcional)
              </label>
              <input
                id="wa-api-token"
                name="apiToken"
                type="password"
                autoComplete="new-password"
                placeholder={initialPanel.hasApiToken ? "Em branco mantém" : "Opcional"}
                disabled={connectPending}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
          </>
        )}

        {platform === "z-api" && (
          <>
            <div>
              <label htmlFor="zapi-base-url" className="mb-1 block text-sm font-medium text-slate-600">
                URL base
              </label>
              <input
                id="zapi-base-url"
                name="baseUrl"
                type="url"
                required
                defaultValue={initialPanel.baseUrl || "https://api.z-api.io"}
                placeholder="https://api.z-api.io"
                disabled={connectPending}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="zapi-instance-id" className="mb-1 block text-sm font-medium text-slate-600">
                ID da instância
              </label>
              <input
                id="zapi-instance-id"
                name="zapiInstanceId"
                type="text"
                required
                defaultValue={initialPanel.zapiInstanceId}
                disabled={connectPending}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="zapi-client-token" className="mb-1 block text-sm font-medium text-slate-600">
                Client-Token
              </label>
              <input
                id="zapi-client-token"
                name="adminToken"
                type="password"
                autoComplete="new-password"
                placeholder={initialPanel.hasAdminToken ? "Em branco mantém o salvo" : ""}
                disabled={connectPending}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="zapi-instance-token" className="mb-1 block text-sm font-medium text-slate-600">
                Token da instância
              </label>
              <input
                id="zapi-instance-token"
                name="apiToken"
                type="password"
                autoComplete="new-password"
                placeholder={initialPanel.hasApiToken ? "Em branco mantém o salvo" : ""}
                disabled={connectPending}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
          </>
        )}

        {platform === "evolution" && (
          <>
            <div>
              <label htmlFor="evo-server" className="mb-1 block text-sm font-medium text-slate-600">
                URL do servidor
              </label>
              <input
                id="evo-server"
                name="baseUrl"
                type="url"
                required
                defaultValue={initialPanel.baseUrl}
                placeholder="http://localhost:8080"
                disabled={connectPending}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="evo-api-key" className="mb-1 block text-sm font-medium text-slate-600">
                API Key
              </label>
              <input
                id="evo-api-key"
                name="adminToken"
                type="password"
                autoComplete="new-password"
                placeholder={initialPanel.hasAdminToken ? "Em branco mantém o salvo" : ""}
                disabled={connectPending}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="evo-instance-name" className="mb-1 block text-sm font-medium text-slate-600">
                Nome da instância
              </label>
              <input
                id="evo-instance-name"
                name="evolutionInstanceName"
                type="text"
                required
                defaultValue={initialPanel.evolutionInstanceName}
                disabled={connectPending}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>
          </>
        )}

        <div className="flex justify-end">
          <FormActionSubmitButton pending={connectPending} pendingLabel="Salvando...">
            Conectar
          </FormActionSubmitButton>
        </div>
      </form>

      {instances.length > 0 && panelIsUazapi && (
        <div className="border-t border-slate-100 pt-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Instâncias disponíveis</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left font-semibold text-slate-700"> </th>
                  <th className="text-left font-semibold text-slate-700">Nome</th>
                  <th className="text-left font-semibold text-slate-700">Status</th>
                  <th className="text-left font-semibold text-slate-700">Perfil</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="text-left align-middle">
                      <input
                        type="radio"
                        name="pickInstance"
                        checked={selectedId === row.id}
                        onChange={() => setSelectedId(row.id)}
                        aria-label={`Selecionar ${row.name}`}
                      />
                    </td>
                    <td className="text-left align-middle text-slate-800">{row.name}</td>
                    <td className="text-left align-middle text-slate-700">
                      <WhatsAppStatusWord value={row.status} />
                    </td>
                    <td className="text-left align-middle text-slate-600">{row.profileName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={handleSelectSubmit} className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={selectPending || !selectedId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {selectPending ? "Salvando..." : "Salvar instância selecionada"}
            </button>
          </form>
        </div>
      )}
        </>
      ) : null}

      {hasSavedInstance ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Instância configurada</h3>
          <div className="flex flex-wrap gap-4">
            {initialPanel.profilePicSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL externa ou rota interna
              <img
                src={initialPanel.profilePicSrc}
                alt=""
                className="size-16 shrink-0 rounded-full border border-slate-200 bg-slate-50 object-cover"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                Sem foto
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm text-slate-800">
                <span className="font-medium">Nome:</span> {initialPanel.instanceName ?? "—"}
              </p>
              <p className="text-sm text-slate-800">
                <span className="font-medium">Status (salvo):</span>{" "}
                <WhatsAppStatusWord value={initialPanel.instanceStatus} />
              </p>
              <p className="text-sm text-slate-800">
                <span className="font-medium">Perfil:</span> {initialPanel.profileName ?? "—"}
              </p>
              {initialPanel.businessProfileSummary ? (
                <p className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Perfil comercial:</span>{" "}
                  {initialPanel.businessProfileSummary}
                </p>
              ) : null}
            </div>
          </div>

          {panelIsUazapi ? (
            pollPayload ? (
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-800">Status</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  <li className="text-left">
                    <span className="font-medium text-slate-800">Estado na API:</span>{" "}
                    <WhatsAppStatusWord value={pollPayload.status} />
                  </li>
                  <li className="text-left">
                    <span className="font-medium text-slate-800">Conectado / logado:</span>{" "}
                    {pollPayload.apiConnected ? "sim" : "não"} /{" "}
                    {pollPayload.apiLoggedIn ? "sim" : "não"}
                  </li>
                  {pollPayload.lastDisconnectReason ? (
                    <li className="text-left text-amber-800">
                      Última desconexão: {pollPayload.lastDisconnectReason}
                    </li>
                  ) : null}
                </ul>
                {pollPayload.paircode ? (
                  <p className="mt-3 text-left text-sm text-slate-700">
                    Código de pareamento:{" "}
                    <code className="rounded bg-white px-2 py-0.5 font-mono text-slate-800">
                      {pollPayload.paircode}
                    </code>
                  </p>
                ) : null}
                {pollPayload.qrcode ? (
                  <div className="mt-3">
                    <p className="mb-2 text-left text-xs font-medium text-slate-600">QR Code</p>
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL da API */}
                    <img
                      src={pollPayload.qrcode}
                      alt="QR Code WhatsApp"
                      className="max-w-[220px] rounded border border-slate-200 bg-white p-2"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Carregando status…</p>
            )
          ) : null}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="mb-1 text-sm font-semibold text-slate-800">Fila async — intervalo entre mensagens</h3>
            <p className="mb-3 text-xs text-slate-500">
              Intervalo em segundos entre envios na fila interna quando usar{" "}
              <code className="rounded bg-slate-100 px-1 text-[11px]">POST /send/text</code> com{" "}
              <code className="rounded bg-slate-100 px-1 text-[11px]">async: true</code>. Equivale a{" "}
              <code className="rounded bg-slate-100 px-1 text-[11px]">/instance/updateDelaySettings</code> na
              UAZAPI. Com instância conectada (UAZAPI), os valores são aplicados na API ao salvar.
            </p>
            <form action={saveDelayAction} className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="wa-async-delay-min" className="mb-1 block text-sm font-medium text-slate-600">
                    Delay mínimo (segundos)
                  </label>
                  <input
                    id="wa-async-delay-min"
                    name="msgDelayMin"
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={delayMinStr}
                    onChange={(e) => setDelayMinStr(e.target.value)}
                    disabled={saveDelayPending}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="wa-async-delay-max" className="mb-1 block text-sm font-medium text-slate-600">
                    Delay máximo (segundos)
                  </label>
                  <input
                    id="wa-async-delay-max"
                    name="msgDelayMax"
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={delayMaxStr}
                    onChange={(e) => setDelayMaxStr(e.target.value)}
                    disabled={saveDelayPending}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                0 = sem espera extra no intervalo mínimo. Se máximo for menor que mínimo, a API pode igualar ao
                mínimo.
              </p>
              <div className="flex justify-end">
                <FormActionSubmitButton pending={saveDelayPending} pendingLabel="Salvando...">
                  Salvar delay
                </FormActionSubmitButton>
              </div>
            </form>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="mb-1 text-sm font-semibold text-slate-800">
              Configuração de receptores
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Números ou contatos que receberão avisos no WhatsApp quando houver ordem de compra enviada ou
              assinada (em paralelo aos e-mails configurados no SMTP).
            </p>
            <form action={saveRecipientsAction} className="space-y-3">
              <input
                type="hidden"
                name="recipientsJson"
                value={JSON.stringify(notifyRecipients)}
                readOnly
              />
              <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-2">
                {notifyRecipients.map((r, idx) => (
                  <span
                    key={`${r}-${idx}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-800"
                  >
                    <span className="truncate">{r}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifyRecipients((prev) => prev.filter((_, i) => i !== idx))
                      }
                      disabled={saveRecipientsPending}
                      className="shrink-0 rounded-full p-0.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-50"
                      aria-label={`Remover ${r}`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const t = recipientInput.trim();
                    if (!t) return;
                    if (t.length > 80) {
                      toast.error("Cada contato pode ter no máximo 80 caracteres.");
                      return;
                    }
                    if (notifyRecipients.length >= 50) {
                      toast.error("No máximo 50 contatos.");
                      return;
                    }
                    if (notifyRecipients.includes(t)) {
                      setRecipientInput("");
                      return;
                    }
                    setNotifyRecipients((prev) => [...prev, t]);
                    setRecipientInput("");
                  }}
                  placeholder={
                    notifyRecipients.length === 0
                      ? "Digite o número ou contato e pressione Enter"
                      : "Adicionar outro…"
                  }
                  disabled={saveRecipientsPending}
                  className="min-h-[32px] min-w-48 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end">
                <FormActionSubmitButton pending={saveRecipientsPending} pendingLabel="Salvando...">
                  Salvar receptores
                </FormActionSubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
