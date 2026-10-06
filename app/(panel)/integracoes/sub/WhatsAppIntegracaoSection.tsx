"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity, List, Plug, Smartphone, Timer, Unplug, UserCircle, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  connectWhatsAppIntegrationAction,
  disconnectWhatsAppIntegrationAction,
  pollWhatsAppInstanceStatusAction,
  saveWhatsAppAsyncDelaySettingsAction,
  saveWhatsAppNotifyRecipientsAction,
  selectWhatsAppInstanceAction,
} from "@/app/actions/whatsapp-integration";
import { useConfirm } from "@/components/confirm-provider";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { MetaList } from "@/components/ui/meta-list";
import { PanelHeader } from "@/components/ui/panel-header";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
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

const codeClassName = "rounded bg-neutral-100 px-1 text-[11px]";

function statusTone(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (normalized === "connected" || normalized === "open") return "success";
  if (normalized === "disconnected" || normalized === "close" || normalized === "closed") return "danger";
  if (normalized === "connecting" || normalized === "pending" || normalized === "qrcode") return "warning";
  return "neutral";
}

function WhatsAppStatusBadge({ value }: { value: string | null | undefined }) {
  const text = value?.trim();
  if (!text) return <span className="text-neutral-500">—</span>;
  return <Badge tone={statusTone(text)}>{text}</Badge>;
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

  function handleRecipientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
  }

  return (
    <div className="max-w-3xl">
      <PanelHeader
        title="WhatsApp"
        description="Instância usada para avisos de ordens de compra no WhatsApp."
        actions={
          hasSavedInstance ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDisconnect()}
              loading={disconnectPending}
              className="text-red-600 hover:bg-red-50"
            >
              {!disconnectPending && <Unplug className="size-4" aria-hidden />}
              {disconnectPending ? "Desconectando…" : "Desconectar"}
            </Button>
          ) : null
        }
      />

      {!hasSavedInstance ? (
        <div>
          <FormSection
            icon={<Plug aria-hidden />}
            title="Conexão"
            description="Plataforma e credenciais da API de WhatsApp."
          >
            <form onSubmit={handleConnectSubmit}>
              <fieldset disabled={connectPending} className="space-y-4">
                <FormField id="wa-platform" label="Plataforma">
                  <Select
                    id="wa-platform"
                    name="platform"
                    value={platform}
                    onChange={(e) => setPlatform(normalizeWhatsAppPlatformId(e.target.value))}
                    className="w-full sm:max-w-xs"
                  >
                    {WHATSAPP_PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_LABEL[p]}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {platform === "uazapi" && (
                  <>
                    <FormField id="wa-base-url" label="URL base da API">
                      <Input
                        id="wa-base-url"
                        name="baseUrl"
                        type="url"
                        required
                        defaultValue={initialPanel.baseUrl}
                        placeholder="https://…"
                        autoComplete="off"
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="wa-admin-token" label="Token administrador (admintoken)">
                        <PasswordInput
                          id="wa-admin-token"
                          name="adminToken"
                          autoComplete="new-password"
                          placeholder={initialPanel.hasAdminToken ? "Em branco mantém o salvo" : "Obrigatório"}
                        />
                      </FormField>
                      <FormField id="wa-api-token" label="Token adicional (opcional)">
                        <PasswordInput
                          id="wa-api-token"
                          name="apiToken"
                          autoComplete="new-password"
                          placeholder={initialPanel.hasApiToken ? "Em branco mantém" : "Opcional"}
                        />
                      </FormField>
                    </div>
                  </>
                )}

                {platform === "z-api" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="zapi-base-url" label="URL base">
                        <Input
                          id="zapi-base-url"
                          name="baseUrl"
                          type="url"
                          required
                          defaultValue={initialPanel.baseUrl || "https://api.z-api.io"}
                          placeholder="https://api.z-api.io"
                          autoComplete="off"
                        />
                      </FormField>
                      <FormField id="zapi-instance-id" label="ID da instância">
                        <Input
                          id="zapi-instance-id"
                          name="zapiInstanceId"
                          type="text"
                          required
                          defaultValue={initialPanel.zapiInstanceId}
                          autoComplete="off"
                        />
                      </FormField>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="zapi-client-token" label="Client-Token">
                        <PasswordInput
                          id="zapi-client-token"
                          name="adminToken"
                          autoComplete="new-password"
                          placeholder={initialPanel.hasAdminToken ? "Em branco mantém o salvo" : ""}
                        />
                      </FormField>
                      <FormField id="zapi-instance-token" label="Token da instância">
                        <PasswordInput
                          id="zapi-instance-token"
                          name="apiToken"
                          autoComplete="new-password"
                          placeholder={initialPanel.hasApiToken ? "Em branco mantém o salvo" : ""}
                        />
                      </FormField>
                    </div>
                  </>
                )}

                {platform === "evolution" && (
                  <>
                    <FormField id="evo-server" label="URL do servidor">
                      <Input
                        id="evo-server"
                        name="baseUrl"
                        type="url"
                        required
                        defaultValue={initialPanel.baseUrl}
                        placeholder="http://localhost:8080"
                        autoComplete="off"
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField id="evo-api-key" label="API Key">
                        <PasswordInput
                          id="evo-api-key"
                          name="adminToken"
                          autoComplete="new-password"
                          placeholder={initialPanel.hasAdminToken ? "Em branco mantém o salvo" : ""}
                        />
                      </FormField>
                      <FormField id="evo-instance-name" label="Nome da instância">
                        <Input
                          id="evo-instance-name"
                          name="evolutionInstanceName"
                          type="text"
                          required
                          defaultValue={initialPanel.evolutionInstanceName}
                          autoComplete="off"
                        />
                      </FormField>
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-1">
                  <Button type="submit" loading={connectPending}>
                    {!connectPending && <Plug className="size-4" aria-hidden />}
                    {connectPending ? "Salvando..." : "Conectar"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </FormSection>

          {instances.length > 0 && panelIsUazapi && (
            <FormSection
              icon={<List aria-hidden />}
              title="Instâncias disponíveis"
              description="Selecione a instância que o sistema deve usar."
            >
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <Table>
                    <TableHead>
                      <TableRow className="bg-neutral-50">
                        <TableHeaderCell className="w-10">
                          <span className="sr-only">Selecionar</span>
                        </TableHeaderCell>
                        <TableHeaderCell>Nome</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Perfil</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {instances.map((row) => (
                        <TableRow
                          key={row.id}
                          className={
                            selectedId === row.id
                              ? "bg-sky-50/60 last:border-b-0"
                              : "transition-colors last:border-b-0 hover:bg-sky-50/60"
                          }
                        >
                          <TableCell>
                            <input
                              type="radio"
                              name="pickInstance"
                              checked={selectedId === row.id}
                              onChange={() => setSelectedId(row.id)}
                              aria-label={`Selecionar ${row.name}`}
                              className="size-4 accent-blue-600"
                            />
                          </TableCell>
                          <TableCell className="max-w-60 truncate font-medium text-neutral-950" title={row.name}>
                            {row.name}
                          </TableCell>
                          <TableCell>
                            <WhatsAppStatusBadge value={row.status} />
                          </TableCell>
                          <TableCell className="max-w-60 truncate" title={row.profileName ?? undefined}>
                            {row.profileName ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <form onSubmit={handleSelectSubmit} className="flex justify-end">
                  <Button type="submit" loading={selectPending} disabled={!selectedId}>
                    {selectPending ? "Salvando..." : "Salvar instância selecionada"}
                  </Button>
                </form>
              </div>
            </FormSection>
          )}
        </div>
      ) : (
        <div>
          <FormSection
            icon={<Smartphone aria-hidden />}
            title="Instância configurada"
            description="Dados salvos da instância conectada."
          >
            <div className="flex flex-wrap items-start gap-5">
              {initialPanel.profilePicSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL externa ou rota interna
                <img
                  src={initialPanel.profilePicSrc}
                  alt=""
                  className="size-16 shrink-0 rounded-full border border-neutral-200 bg-neutral-50 object-cover"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <UserCircle className="size-8" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-3">
                <MetaList
                  items={[
                    { label: "Nome", value: initialPanel.instanceName ?? "—" },
                    { label: "Status (salvo)", value: <WhatsAppStatusBadge value={initialPanel.instanceStatus} /> },
                    { label: "Perfil", value: initialPanel.profileName ?? "—" },
                  ]}
                />
                {initialPanel.businessProfileSummary ? (
                  <p className="text-xs text-neutral-500">
                    <span className="font-medium text-neutral-700">Perfil comercial:</span>{" "}
                    {initialPanel.businessProfileSummary}
                  </p>
                ) : null}
              </div>
            </div>
          </FormSection>

          {panelIsUazapi ? (
            <FormSection
              icon={<Activity aria-hidden />}
              title="Status na API"
              description="Atualizado automaticamente a cada 12 segundos."
            >
              {pollPayload ? (
                <div className="space-y-4">
                  <MetaList
                    items={[
                      { label: "Estado na API", value: <WhatsAppStatusBadge value={pollPayload.status} /> },
                      {
                        label: "Conectado",
                        value: (
                          <Badge tone={pollPayload.apiConnected ? "success" : "danger"}>
                            {pollPayload.apiConnected ? "Sim" : "Não"}
                          </Badge>
                        ),
                      },
                      {
                        label: "Logado",
                        value: (
                          <Badge tone={pollPayload.apiLoggedIn ? "success" : "danger"}>
                            {pollPayload.apiLoggedIn ? "Sim" : "Não"}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                  {pollPayload.lastDisconnectReason ? (
                    <p className="text-[13px] text-amber-700">
                      Última desconexão: {pollPayload.lastDisconnectReason}
                    </p>
                  ) : null}
                  {pollPayload.paircode ? (
                    <p className="text-[13px] text-neutral-700">
                      Código de pareamento:{" "}
                      <code className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-neutral-800">
                        {pollPayload.paircode}
                      </code>
                    </p>
                  ) : null}
                  {pollPayload.qrcode ? (
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-500">QR Code</p>
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URL da API */}
                      <img
                        src={pollPayload.qrcode}
                        alt="QR Code WhatsApp"
                        className="max-w-[220px] rounded-lg border border-neutral-200 bg-white p-2"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">Carregando status…</p>
              )}
            </FormSection>
          ) : null}

          <FormSection
            icon={<Timer aria-hidden />}
            title="Fila async — intervalo entre mensagens"
            description="Intervalo em segundos entre envios na fila interna."
          >
            <form action={saveDelayAction}>
              <fieldset disabled={saveDelayPending} className="space-y-4">
                <p className="text-xs text-neutral-500">
                  Vale quando usar <code className={codeClassName}>POST /send/text</code> com{" "}
                  <code className={codeClassName}>async: true</code>. Equivale a{" "}
                  <code className={codeClassName}>/instance/updateDelaySettings</code> na UAZAPI. Com instância
                  conectada (UAZAPI), os valores são aplicados na API ao salvar.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="wa-async-delay-min" label="Delay mínimo (segundos)">
                    <Input
                      id="wa-async-delay-min"
                      name="msgDelayMin"
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={delayMinStr}
                      onChange={(e) => setDelayMinStr(e.target.value)}
                      className="tabular-nums"
                    />
                  </FormField>
                  <FormField id="wa-async-delay-max" label="Delay máximo (segundos)">
                    <Input
                      id="wa-async-delay-max"
                      name="msgDelayMax"
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={delayMaxStr}
                      onChange={(e) => setDelayMaxStr(e.target.value)}
                      className="tabular-nums"
                    />
                  </FormField>
                </div>
                <p className="text-xs text-neutral-500">
                  0 = sem espera extra no intervalo mínimo. Se máximo for menor que mínimo, a API pode igualar ao
                  mínimo.
                </p>
                <div className="flex justify-end">
                  <Button type="submit" loading={saveDelayPending}>
                    {saveDelayPending ? "Salvando..." : "Salvar delay"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </FormSection>

          <FormSection
            icon={<Users aria-hidden />}
            title="Receptores"
            description="Números ou contatos avisados quando houver ordem de compra enviada ou assinada (em paralelo aos e-mails do SMTP)."
          >
            <form action={saveRecipientsAction} className="space-y-4">
              <input
                type="hidden"
                name="recipientsJson"
                value={JSON.stringify(notifyRecipients)}
                readOnly
              />
              <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-field border border-neutral-300 bg-white px-2 py-1.5 transition-colors focus-within:border-neutral-700 focus-within:ring-2 focus-within:ring-neutral-900/5 hover:border-neutral-400">
                {notifyRecipients.map((r, idx) => (
                  <span
                    key={`${r}-${idx}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-neutral-100 py-0.5 pr-1 pl-2.5 text-xs text-neutral-700"
                  >
                    <span className="truncate">{r}</span>
                    <button
                      type="button"
                      onClick={() => setNotifyRecipients((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={saveRecipientsPending}
                      className="shrink-0 rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-800 disabled:pointer-events-none disabled:opacity-50"
                      aria-label={`Remover ${r}`}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={handleRecipientKeyDown}
                  placeholder={
                    notifyRecipients.length === 0
                      ? "Digite o número ou contato e pressione Enter"
                      : "Adicionar outro…"
                  }
                  aria-label="Adicionar receptor"
                  disabled={saveRecipientsPending}
                  className="min-h-7 min-w-48 flex-1 border-0 bg-transparent px-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={saveRecipientsPending}>
                  {saveRecipientsPending ? "Salvando..." : "Salvar receptores"}
                </Button>
              </div>
            </form>
          </FormSection>
        </div>
      )}
    </div>
  );
}
