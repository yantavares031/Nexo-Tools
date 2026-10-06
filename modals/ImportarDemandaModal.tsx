"use client";

import {
  useActionState,
  useRef,
  useCallback,
  useState,
  useEffect,
  startTransition,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  File,
  FileArchive,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image,
  Presentation,
  Workflow,
} from "lucide-react";
import { createDemandaAction } from "@/app/actions/demanda";
import { getDeskfyTaskDetailsAction } from "@/app/actions/deskfy-task-details";
import type { DemandaFilterOptions } from "@/lib/domain/demanda.repository";
import { CurrencyInputControlled } from "@/components/CurrencyInputControlled";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToastOnActionError } from "@/lib/use-toast-on-action-error";
import { DemandaCentrosCusto } from "./sub/DemandaCentrosCusto";
import type {
  DemandaCentroCusto,
  DeskfyTaskDetailsAnexo,
  DeskfyTaskDetailsResponse,
} from "@/types/globals";
import { formatBrazilianCurrency } from "@/lib/currency";
import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";
import { getOcPiFromDeskfyPreview } from "@/lib/deskfy/deskfy-preview-ocpi";
import { formatDeskfyBriefingFieldLabel } from "@/lib/deskfy/format-deskfy-briefing-label";
import { DeskfyAnexoPreviewModal } from "@/modals/DeskfyAnexoPreviewModal";

type ImportTabId = "dados" | "briefing" | "anexos";

type AttachmentVisual = {
  Icon: LucideIcon;
  wrapperClass: string;
  iconClass: string;
  typeLabel: string;
};

function deskfyAttachmentVisual(extension?: string, contentType?: string): AttachmentVisual {
  const ext = (extension ?? "").toLowerCase().replace(/^\./, "");
  const ct = (contentType ?? "").toLowerCase();

  if (ext === "pdf" || ct.includes("pdf")) {
    return {
      Icon: FileText,
      wrapperClass: "bg-red-50 ring-1 ring-red-100",
      iconClass: "text-red-600",
      typeLabel: "PDF",
    };
  }

  if (
    ct.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic", "ico"].includes(ext)
  ) {
    return {
      Icon: Image,
      wrapperClass: "bg-sky-50 ring-1 ring-sky-100",
      iconClass: "text-sky-600",
      typeLabel: ext ? ext.toUpperCase() : "Imagem",
    };
  }

  if (
    ["xls", "xlsx", "csv", "ods"].includes(ext) ||
    ct.includes("spreadsheet") ||
    ct.includes("excel") ||
    ct === "text/csv"
  ) {
    return {
      Icon: FileSpreadsheet,
      wrapperClass: "bg-lime-50 ring-1 ring-lime-100",
      iconClass: "text-lime-700",
      typeLabel: ext ? ext.toUpperCase() : "Planilha",
    };
  }

  if (
    ["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext) ||
    ct.includes("wordprocessing") ||
    ct === "text/plain"
  ) {
    return {
      Icon: FileText,
      wrapperClass: "bg-sky-50 ring-1 ring-sky-100",
      iconClass: "text-link",
      typeLabel: ext ? ext.toUpperCase() : "Documento",
    };
  }

  if (["ppt", "pptx", "odp"].includes(ext) || ct.includes("presentation")) {
    return {
      Icon: Presentation,
      wrapperClass: "bg-orange-50 ring-1 ring-orange-100",
      iconClass: "text-orange-600",
      typeLabel: ext ? ext.toUpperCase() : "Apresentação",
    };
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || ct.includes("zip") || ct.includes("compressed")) {
    return {
      Icon: FileArchive,
      wrapperClass: "bg-amber-50 ring-1 ring-amber-100",
      iconClass: "text-amber-700",
      typeLabel: ext ? ext.toUpperCase() : "Arquivo",
    };
  }

  if (ct.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return {
      Icon: FileVideo,
      wrapperClass: "bg-violet-50 ring-1 ring-violet-100",
      iconClass: "text-violet-600",
      typeLabel: ext ? ext.toUpperCase() : "Vídeo",
    };
  }

  if (ct.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext)) {
    return {
      Icon: FileAudio,
      wrapperClass: "bg-fuchsia-50 ring-1 ring-fuchsia-100",
      iconClass: "text-fuchsia-600",
      typeLabel: ext ? ext.toUpperCase() : "Áudio",
    };
  }

  return {
    Icon: File,
    wrapperClass: "bg-neutral-100 ring-1 ring-neutral-200",
    iconClass: "text-neutral-600",
    typeLabel: ext ? ext.toUpperCase() : "Arquivo",
  };
}

function ImportarDemandaAnexoCard({
  anexo,
  onOpenPreview,
}: {
  anexo: DeskfyTaskDetailsAnexo;
  onOpenPreview: (url: string, title: string, extension?: string, contentType?: string) => void;
}) {
  const href = anexo.publicUrl?.trim() || anexo.url?.trim() || "";
  const displayName = anexo.name?.trim() || `Anexo ${anexo.id}`;
  const visual = deskfyAttachmentVisual(anexo.extension, anexo.contentType);
  const { Icon } = visual;

  const cardClass =
    "group flex w-full items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800";

  const body = (
    <>
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${visual.wrapperClass}`}
        aria-hidden
      >
        <Icon className={`size-5 ${visual.iconClass}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-neutral-800">{displayName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="inline-flex rounded-md bg-neutral-100 px-1.5 py-0.5 text-left text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
            {visual.typeLabel}
          </span>
          {anexo.contentType ? (
            <span className="text-left text-[11px] text-neutral-400">{anexo.contentType}</span>
          ) : null}
        </div>
        {!href ? (
          <p className="mt-2 text-left text-xs text-amber-700">URL pública indisponível.</p>
        ) : null}
      </div>
      {href ? (
        <ExternalLink
          className="size-4 shrink-0 text-neutral-300 transition group-hover:text-link"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (href) {
    return (
      <button
        type="button"
        className={cardClass}
        onClick={() => onOpenPreview(href, displayName, anexo.extension, anexo.contentType)}
        aria-label={`Pré-visualizar ${displayName}`}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={`${cardClass} cursor-default hover:border-neutral-200 hover:shadow-sm`}>{body}</div>
  );
}

function briefingValueToDisplay(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

interface ImportarDemandaModalProps {
  open: boolean;
  onClose: () => void;
  options: DemandaFilterOptions;
  initialData: DemandaImportadaPreview | null;
  initialDeskfyDetails?: DeskfyTaskDetailsResponse | null;
}

export function ImportarDemandaModal({
  open,
  onClose,
  options,
  initialData,
  initialDeskfyDetails = null,
}: ImportarDemandaModalProps) {
  const [state, formAction, isImportPending] = useActionState(
    createDemandaAction,
    null
  );
  useToastOnActionError(state);
  const unResponsavelRef = useRef<HTMLInputElement>(null);
  const [centrosCusto, setCentrosCusto] = useState<DemandaCentroCusto[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<ImportTabId>("dados");
  const [deskfyDetails, setDeskfyDetails] = useState<DeskfyTaskDetailsResponse | null>(null);
  const [deskfyLoading, setDeskfyLoading] = useState(false);
  const [deskfyError, setDeskfyError] = useState<string | null>(null);
  const [anexoPreview, setAnexoPreview] = useState<{
    url: string;
    title: string;
    extension?: string;
    contentType?: string;
  } | null>(null);

  const demanda = initialData?.demanda ?? "";
  const solicitante = initialData?.solicitante ?? "";
  const boardKey = initialData?.board?.trim() ?? "";
  const agenciaPreSelecionada = (boardKey && options.agenciaPorBoard?.[boardKey]) ?? "";
  const solicitanteEncontrado = solicitante
    ? options.solicitantesComUnidade.some(
        (s) => s.nome.toLowerCase() === solicitante.toLowerCase()
      )
    : false;
  const unResponsavel =
    options.solicitantesComUnidade.find(
      (s) => s.nome.toLowerCase() === solicitante.toLowerCase()
    )?.unResponsavel ?? "";
  const ocPi = initialData ? getOcPiFromDeskfyPreview(initialData) : "";
  const mesYyyyMm = initialData?.mesYyyyMm ?? "";

  const handleCloseImportModal = useCallback(() => {
    setAnexoPreview(null);
    onClose();
  }, [onClose]);

  const handleSolicitanteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();
      const match = options.solicitantesComUnidade.find(
        (s) => s.nome.toLowerCase() === value.toLowerCase()
      );
      if (match && unResponsavelRef.current) {
        unResponsavelRef.current.value = match.unResponsavel;
      }
    },
    [options.solicitantesComUnidade]
  );

  useEffect(() => {
    if (open && unResponsavelRef.current && unResponsavel) {
      unResponsavelRef.current.value = unResponsavel;
    }
  }, [open, unResponsavel]);

  useEffect(() => {
    if (!open || !initialData?.id) {
      queueMicrotask(() => {
        setDeskfyDetails(null);
        setDeskfyError(null);
        setDeskfyLoading(false);
      });
      return;
    }

    if (initialDeskfyDetails) {
      queueMicrotask(() => {
        setActiveTab("dados");
        setDeskfyDetails(initialDeskfyDetails);
        setDeskfyError(null);
        setDeskfyLoading(false);
      });
      return;
    }

    startTransition(() => {
      setActiveTab("dados");
      setDeskfyDetails(null);
      setDeskfyError(null);
      setDeskfyLoading(true);
    });

    let cancelled = false;
    void getDeskfyTaskDetailsAction(initialData.id).then((result) => {
      if (cancelled) return;
      setDeskfyLoading(false);
      if (result.error) {
        setDeskfyError(result.error);
        setDeskfyDetails(null);
        return;
      }
      setDeskfyDetails(result.data ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [open, initialData?.id, initialDeskfyDetails]);

  if (!initialData) return null;

  const briefing = deskfyDetails?.briefing;
  const briefingPublicUrls = briefing?.publicUrls;
  const briefingFieldEntries = briefing
    ? Object.entries(briefing).filter(([key]) => key !== "publicUrls")
    : [];
  const anexosList = deskfyDetails?.anexos ?? [];

  return (
    <>
    <Modal
      open={open}
      onClose={handleCloseImportModal}
      maxWidth="3xl"
      ariaLabelledby="importar-modal-title"
      escapeEnabled={!anexoPreview && !isImportPending}
      closeOnOverlayClick={!isImportPending}
    >
      <Modal.Header onClose={handleCloseImportModal} closeDisabled={isImportPending}>
        <h2 id="importar-modal-title" className="flex items-center gap-2 text-lg font-semibold text-neutral-950">
          <Workflow className="size-5 shrink-0" />
          Importar demanda
        </h2>
      </Modal.Header>
      <Modal.Body
        as="form"
        id="importar-demanda-form"
        key={initialData.id}
        action={async (formData: FormData) => {
          if (centrosCusto.length > 0) {
            const validCentros = centrosCusto.filter((cc) => cc.centroDeCusto && cc.valor > 0);
            formData.set(
              "centrosCusto",
              JSON.stringify(
                validCentros.map((cc) => ({
                  centroDeCusto: cc.centroDeCusto,
                  valor: cc.valor,
                  ordem: cc.ordem,
                }))
              )
            );
          }
          formAction(formData);
        }}
        className="flex max-h-[70vh] flex-col p-0"
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="flex gap-7 border-b border-neutral-200" role="tablist" aria-label="Seções da importação">
            {(
              [
                { id: "dados" as const, label: "Dados" },
                { id: "briefing" as const, label: "Briefing" },
                { id: "anexos" as const, label: "Anexos" },
              ] as const
            ).map(({ id, label }) => {
              const isSelected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(id)}
                  className={`-mb-px border-b-2 px-1 pb-3 text-sm whitespace-nowrap transition-colors ${
                    isSelected
                      ? "border-accent font-medium text-neutral-950"
                      : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-950"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <input type="hidden" name="redirectTo" value="importar" />
        <div className={`space-y-3 ${activeTab !== "dados" ? "hidden" : ""}`}>
          <div>
            <Label htmlFor="import-demanda" className="mb-1.5">
              Demanda *
            </Label>
            <Input
              id="import-demanda"
              name="demanda"
              type="text"
              required
              defaultValue={demanda}
              placeholder="Descrição da demanda"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label htmlFor="import-solicitante" className="mb-1.5">
                Solicitante *
              </Label>
              <Input
                id="import-solicitante"
                name="solicitante"
                type="text"
                list="import-solicitantes-list"
                required
                autoComplete="off"
                defaultValue={solicitante}
                onChange={handleSolicitanteChange}
                placeholder="Selecione ou digite"
              />
              <datalist id="import-solicitantes-list">
                {options.solicitantesComUnidade.map((s) => (
                  <option key={`${s.nome}-${s.unResponsavel}`} value={s.nome} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="import-unResponsavel" className="mb-1.5">
                Un. Responsável *
              </Label>
              <Input
                ref={unResponsavelRef}
                id="import-unResponsavel"
                name="unResponsavel"
                type="text"
                list="import-unidades-list"
                required
                autoComplete="off"
                defaultValue={unResponsavel}
                placeholder="Preenchido ao selecionar solicitante"
              />
              <datalist id="import-unidades-list">
                {options.unResponsaveis.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="import-status" className="mb-1.5">
                Status
              </Label>
              <Select
                id="import-status"
                name="status"
                defaultValue="entregue" className="w-full"
              >
                <option value="comprometido">Comprometido</option>
                <option value="faturado">Faturado</option>
                <option value="entregue">Entregue</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="import-agencia" className="mb-1.5">
                Agência
              </Label>
              <Select
                id="import-agencia"
                name="agencia"
                defaultValue={agenciaPreSelecionada} className="w-full"
              >
                <option value="">Selecione</option>
                {options.agencias.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {solicitante && !solicitanteEncontrado && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              Não encontramos o solicitante <strong>{solicitante}</strong> cadastrado no sistema.
            </div>
          )}

          <div>
            <Label htmlFor="import-obs" className="mb-1.5">
              Observações
            </Label>
            <Input
              id="import-obs"
              name="obs"
              type="text"
              placeholder="Observações (opcional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Label htmlFor="import-valor" className="mb-1.5">
                Valor (R$)
              </Label>
              <div className="relative">
                <CurrencyInputControlled
                  value={valorTotal}
                  onChange={(valor) => setValorTotal(valor)}
                />
                <input
                  type="hidden"
                  name="valor"
                  value={formatBrazilianCurrency(valorTotal)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="import-ocPi" className="mb-1.5">
                OC/PI
              </Label>
              <Input
                id="import-ocPi"
                name="ocPi"
                type="text"
                defaultValue={ocPi}
                placeholder="SEB-300114"
              />
            </div>
            <div>
              <Label htmlFor="import-mes" className="mb-1.5">
                Mês / Ano
              </Label>
              <Input
                id="import-mes"
                name="mes"
                type="month"
                defaultValue={mesYyyyMm}
              />
            </div>
          </div>

          {valorTotal > 0 && (
            <DemandaCentrosCusto
              demandaId=""
              valorTotal={valorTotal}
              readOnly={false}
              onChange={setCentrosCusto}
            />
          )}
        </div>

        <div className={`space-y-4 ${activeTab !== "briefing" ? "hidden" : ""}`} role="tabpanel">
          {deskfyLoading && (
            <p className="text-left text-sm text-neutral-500">Carregando briefing e anexos na Deskfy…</p>
          )}
          {!deskfyLoading && deskfyError && (
            <p className="text-left text-sm text-red-600">{deskfyError}</p>
          )}
          {!deskfyLoading && !deskfyError && !briefing && (
            <p className="text-left text-sm text-neutral-500">Nenhum briefing retornado para esta demanda.</p>
          )}
          {!deskfyLoading && !deskfyError && briefing && (
            <>
              <h3 className="text-left text-lg font-semibold text-neutral-800">Campos do formulário</h3>
              <ol className="m-0 list-none space-y-3 p-0" aria-label="Campos do formulário do briefing">
                {briefingFieldEntries.length === 0 ? (
                  <li className="text-left text-sm text-neutral-500">Nenhum campo de texto no briefing.</li>
                ) : (
                  briefingFieldEntries.map(([key, value], index) => {
                    const n = index + 1;
                    const labelText = formatDeskfyBriefingFieldLabel(key);
                    return (
                      <li key={key} className="list-none">
                        <article
                          className="overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-sm ring-1 ring-neutral-100"
                          aria-label={`Campo ${n} de ${briefingFieldEntries.length}: ${labelText}`}
                        >
                          <div className="space-y-2 p-4">
                            <h4 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-left text-sm font-semibold leading-snug text-neutral-800">
                              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-xs font-bold tabular-nums text-link-hover ring-1 ring-sky-100">
                                {n}
                              </span>
                              <span className="min-w-0 flex-1">{labelText}</span>
                            </h4>
                            <div className="rounded-lg border border-neutral-100 bg-neutral-50/90 px-3 py-2.5 text-left text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap wrap-break-word">
                              {briefingValueToDisplay(value)}
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })
                )}
              </ol>

              {briefingPublicUrls && Object.keys(briefingPublicUrls).length > 0 && (
                <div className="space-y-3 border-t border-neutral-100 pt-4">
                  <h3 className="text-left text-lg font-semibold text-neutral-800">Anexos do briefing</h3>
                  {Object.entries(briefingPublicUrls).map(([fieldKey, urls]) => (
                    <div key={fieldKey}>
                      <p className="mb-2 text-left text-sm font-medium text-neutral-600">
                        {formatDeskfyBriefingFieldLabel(fieldKey)}
                      </p>
                      <ul className="space-y-2">
                        {(urls ?? []).map((href, idx) => (
                          <li key={`${fieldKey}-${idx}`} className="text-left">
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-link hover:underline"
                            >
                              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                              {urls.length > 1 ? `Abrir arquivo ${idx + 1}` : "Abrir arquivo"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className={`space-y-3 ${activeTab !== "anexos" ? "hidden" : ""}`} role="tabpanel">
          {deskfyLoading && (
            <p className="text-left text-sm text-neutral-500">Carregando anexos na Deskfy…</p>
          )}
          {!deskfyLoading && deskfyError && (
            <p className="text-left text-sm text-red-600">{deskfyError}</p>
          )}
          {!deskfyLoading && !deskfyError && anexosList.length === 0 && (
            <p className="text-left text-sm text-neutral-500">Nenhum anexo nesta demanda.</p>
          )}
          {!deskfyLoading && !deskfyError && anexosList.length > 0 && (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {anexosList.map((anexo) => (
                <li key={anexo.id} className="min-w-0 list-none">
                  <ImportarDemandaAnexoCard
                    anexo={anexo}
                    onOpenPreview={(url, title, extension, contentType) =>
                      setAnexoPreview({ url, title, extension, contentType })
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={handleCloseImportModal} disabled={isImportPending}>
          Cancelar
        </Button>
        <Button type="submit" form="importar-demanda-form" loading={isImportPending} className="min-w-30">
          {isImportPending ? "Importando…" : "Importar"}
        </Button>
      </Modal.Footer>
    </Modal>
    <DeskfyAnexoPreviewModal
      open={anexoPreview != null}
      onClose={() => setAnexoPreview(null)}
      url={anexoPreview?.url ?? ""}
      title={anexoPreview?.title ?? ""}
      extension={anexoPreview?.extension}
      contentType={anexoPreview?.contentType}
    />
    </>
  );
}
