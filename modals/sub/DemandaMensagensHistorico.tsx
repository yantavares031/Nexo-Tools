"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { addDemandaMensagemAction, getDemandaMensagensAction } from "@/app/actions/demanda-mensagem";
import type { DemandaMensagem } from "@/types/globals";
import { toast } from "sonner";

interface DemandaMensagensHistoricoProps {
  demandaId: string;
  readOnly?: boolean; // Mantido para compatibilidade, mas não usado para desabilitar comentários
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function DemandaMensagensHistorico({
  demandaId,
  readOnly = false,
}: DemandaMensagensHistoricoProps) {
  const [mensagens, setMensagens] = useState<DemandaMensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const mensagensContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadMensagens() {
      try {
        const msgs = await getDemandaMensagensAction(demandaId);
        setMensagens(msgs);
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMensagens();
  }, [demandaId]);

  useEffect(() => {
    // Scroll para o topo quando novas mensagens são adicionadas (ordem decrescente)
    if (mensagensContainerRef.current && mensagens.length > 0) {
      mensagensContainerRef.current.scrollTop = 0;
    }
  }, [mensagens]);

  function handleSubmit() {
    const mensagemTrimmed = novaMensagem.trim();
    if (!mensagemTrimmed || isPending) return;

    startTransition(async () => {
      const result = await addDemandaMensagemAction(demandaId, mensagemTrimmed);
      if (result.error) {
        toast.error(result.error);
      } else if (result.mensagem) {
        setMensagens((prev) => [result.mensagem!, ...prev]);
        setNovaMensagem("");
        inputRef.current?.focus();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="mt-6 space-y-3 border-t border-neutral-200 pt-6">
      <h3 className="text-sm font-semibold text-neutral-950">Histórico de mensagens</h3>

      {/* Área de mensagens com scroll */}
      <div
        ref={mensagensContainerRef}
        className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-neutral-400" />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-8 text-[13px] text-neutral-500">Nenhuma mensagem ainda. Seja o primeiro a comentar!</p>
        ) : (
          <div className="space-y-3">
            {mensagens.map((msg) => (
              <div key={msg.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-950">{msg.autor}</span>
                  <span className="text-[11px] tabular-nums text-neutral-500">{formatDateTime(msg.createdAt)}</span>
                </div>
                <p className="text-[13px] whitespace-pre-wrap text-neutral-700">{msg.mensagem}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input para nova mensagem */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem e pressione Enter..."
          disabled={isPending}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!novaMensagem.trim()}
          loading={isPending}
          className="h-10"
        >
          {!isPending && "Enviar"}
        </Button>
      </div>
    </div>
  );
}
