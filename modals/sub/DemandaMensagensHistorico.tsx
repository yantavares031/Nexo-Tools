"use client";

import { useState, useEffect, useRef, useTransition } from "react";
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
    <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
      <h3 className="text-sm font-semibold text-slate-800">Histórico de mensagens</h3>

      {/* Área de mensagens com scroll */}
      <div
        ref={mensagensContainerRef}
        className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhuma mensagem ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          <div className="space-y-3">
            {mensagens.map((msg) => (
              <div key={msg.id} className="rounded-lg bg-white p-3 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{msg.autor}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.mensagem}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input para nova mensagem */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem e pressione Enter..."
          disabled={isPending}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!novaMensagem.trim() || isPending}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "Enviar"
          )}
        </button>
      </div>
    </div>
  );
}
