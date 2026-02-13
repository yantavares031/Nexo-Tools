"use client";

import { useState, useEffect, useTransition } from "react";
import type { DemandaCentroCusto } from "@/types/globals";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCentrosCustoAction } from "@/app/actions/demanda-centro-custo";
import { listCentrosCustoAction } from "@/app/actions/centro-custo";
import { CurrencyInputControlled } from "@/components/CurrencyInputControlled";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { CentroCusto } from "@/types/globals";

interface DemandaCentrosCustoProps {
  demandaId: string;
  valorTotal: number;
  readOnly?: boolean;
  onChange?: (centrosCusto: DemandaCentroCusto[]) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function DemandaCentrosCusto({
  demandaId,
  valorTotal,
  readOnly = false,
  onChange,
}: DemandaCentrosCustoProps) {
  const [centrosCusto, setCentrosCusto] = useState<Array<Omit<DemandaCentroCusto, "id"> & { id?: string; tempId?: string }>>([]);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);
  const [centrosCustoOptions, setCentrosCustoOptions] = useState<CentroCusto[]>([]);

  // Carregar lista de centros de custo disponíveis
  useEffect(() => {
    async function loadCentrosCustoOptions() {
      try {
        const result = await listCentrosCustoAction();
        if (result.centrosCusto) {
          setCentrosCustoOptions(result.centrosCusto);
        }
      } catch (error) {
        console.error("Erro ao carregar opções de centros de custo:", error);
      }
    }
    loadCentrosCustoOptions();
  }, []);

  // Carregar centros de custo existentes
  useEffect(() => {
    async function loadCentrosCusto() {
      if (!demandaId) {
        // Se não há demandaId (criando nova demanda), inicializar com valor total quando houver valor
        if (!readOnly && valorTotal > 0 && !isInitialized) {
          setCentrosCusto([
            {
              demandaId: "",
              centroDeCusto: "",
              valor: valorTotal,
              ordem: 0,
              tempId: "temp-0",
            },
          ]);
          setIsInitialized(true);
        } else if (valorTotal === 0 && isInitialized) {
          // Limpar quando o valor voltar a zero
          setCentrosCusto([]);
          setIsInitialized(false);
        }
        return;
      }

      try {
        const existentes = await getCentrosCustoAction(demandaId);
        if (existentes.length > 0) {
          setCentrosCusto(existentes.map((cc) => ({ ...cc, tempId: undefined })));
          setIsInitialized(true);
        } else if (!readOnly && valorTotal > 0 && !isInitialized) {
          // Inicializar com um centro de custo vazio se não houver nenhum
          setCentrosCusto([
            {
              demandaId,
              centroDeCusto: "",
              valor: valorTotal,
              ordem: 0,
              tempId: "temp-0",
            },
          ]);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Erro ao carregar centros de custo:", error);
        if (!readOnly && valorTotal > 0 && !isInitialized) {
          // Em caso de erro, inicializar com um centro de custo vazio
          setCentrosCusto([
            {
              demandaId,
              centroDeCusto: "",
              valor: valorTotal,
              ordem: 0,
              tempId: "temp-0",
            },
          ]);
          setIsInitialized(true);
        }
      }
    }
    loadCentrosCusto();
  }, [demandaId, readOnly, valorTotal, isInitialized]);

  // Atualizar valor quando valorTotal mudar e houver apenas um centro de custo temporário
  useEffect(() => {
    if (centrosCusto.length === 1 && centrosCusto[0].tempId && valorTotal > 0) {
      setCentrosCusto([{
        ...centrosCusto[0],
        valor: valorTotal,
      }]);
    }
  }, [valorTotal]);

  // Notificar mudanças
  useEffect(() => {
    if (onChange) {
      const validCentros = centrosCusto.filter((cc) => cc.id || (cc.centroDeCusto && cc.valor > 0));
      onChange(validCentros as DemandaCentroCusto[]);
    }
  }, [centrosCusto, onChange]);

  function handleAddCentroCusto() {
    const novaOrdem = centrosCusto.length;
    const valorRestante = calcularValorRestante();
    
    setCentrosCusto((prev) => [
      ...prev,
      {
        demandaId,
        centroDeCusto: "",
        valor: valorRestante,
        ordem: novaOrdem,
        tempId: `temp-${Date.now()}`,
      },
    ]);
  }

  function handleRemoveCentroCusto(index: number) {
    if (centrosCusto.length === 1) {
      toast.error("Deve haver pelo menos um centro de custo");
      return;
    }

    const removido = centrosCusto[index];
    const novosCentros = centrosCusto.filter((_, i) => i !== index);
    
    // Redistribuir valores se necessário
    if (novosCentros.length > 0 && removido.valor > 0) {
      const valorRestante = calcularValorRestante() + removido.valor;
      // Adicionar o valor removido ao primeiro centro de custo
      novosCentros[0] = {
        ...novosCentros[0],
        valor: novosCentros[0].valor + removido.valor,
      };
    }

    // Reordenar
    const reordenados = novosCentros.map((cc, i) => ({ ...cc, ordem: i }));
    setCentrosCusto(reordenados);
  }

  function handleCentroCustoChange(index: number, centroCustoId: string) {
    const centroCustoSelecionado = centrosCustoOptions.find((cc) => cc.id === centroCustoId);
    const nomeCentroCusto = centroCustoSelecionado?.nome || "";
    
    setCentrosCusto((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], centroDeCusto: nomeCentroCusto };
      return novos;
    });
  }

  function handleValorChange(index: number, valor: number) {
    setCentrosCusto((prev) => {
      const novos = [...prev];
      novos[index] = { ...novos[index], valor };
      
      // Se não é o último centro de custo, ajustar o próximo automaticamente
      if (index < novos.length - 1) {
        const somaAtual = novos.reduce((acc, cc, i) => {
          if (i <= index) return acc + cc.valor;
          return acc;
        }, 0);
        const valorRestante = valorTotal - somaAtual;
        novos[index + 1] = {
          ...novos[index + 1],
          valor: Math.max(0, valorRestante),
        };
      }
      
      return novos;
    });
  }

  function calcularValorRestante(): number {
    const somaAtual = centrosCusto.reduce((acc, cc) => acc + cc.valor, 0);
    return Math.max(0, valorTotal - somaAtual);
  }

  const somaAtual = centrosCusto.reduce((acc, cc) => acc + cc.valor, 0);
  const diferenca = valorTotal - somaAtual;
  const temErro = Math.abs(diferenca) > 0.01; // Tolerância para arredondamento

  return (
    <div className="space-y-3">
      {centrosCusto.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Centros de Custo</h3>
          {!readOnly && (
            <button
              type="button"
              onClick={handleAddCentroCusto}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600"
            >
              <Plus className="size-3.5" />
              Adicionar
            </button>
          )}
        </div>
      )}

      {centrosCusto.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          Nenhum centro de custo cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {centrosCusto.map((cc, index) => (
            <div
              key={cc.id || cc.tempId || index}
              className="relative flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              {!readOnly && centrosCusto.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCentroCusto(index)}
                  className="absolute right-2 top-2 rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                  title="Remover centro de custo"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Centro de Custo
                </label>
                {readOnly ? (
                  <div className="rounded px-2 py-1 text-sm text-slate-800">{cc.centroDeCusto || "—"}</div>
                ) : (
                  <SearchableSelect
                    options={centrosCustoOptions.map((cc) => ({
                      id: cc.id,
                      label: cc.nome,
                    }))}
                    value={
                      centrosCustoOptions.find((opt) => opt.nome === cc.centroDeCusto)?.id || ""
                    }
                    onChange={(centroCustoId) => handleCentroCustoChange(index, centroCustoId)}
                    placeholder="Buscar centro de custo..."
                    disabled={isPending}
                  />
                )}
              </div>
              <div className="w-32 shrink-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Valor
                </label>
                {readOnly ? (
                  <div className="rounded px-2 py-1 text-sm font-medium text-slate-800">
                    {formatCurrency(cc.valor)}
                  </div>
                ) : (
                  <CurrencyInputControlled
                    value={cc.valor}
                    onChange={(valor) => handleValorChange(index, valor)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!readOnly && centrosCusto.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Total dos centros de custo:</span>
            <span className={`font-semibold ${temErro ? "text-red-600" : "text-slate-800"}`}>
              {formatCurrency(somaAtual)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Valor total da demanda:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(valorTotal)}</span>
          </div>
          {temErro && (
            <div className="mt-2 text-xs text-red-600">
              {diferenca > 0
                ? `Faltam ${formatCurrency(diferenca)} para completar o valor total`
                : `Excedeu ${formatCurrency(Math.abs(diferenca))} do valor total`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
