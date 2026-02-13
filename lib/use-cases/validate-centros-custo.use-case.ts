import type { DemandaCentroCustoInput } from "@/types/globals";

interface ValidateCentrosCustoInput {
  centrosCusto: Array<Omit<DemandaCentroCustoInput, "demandaId">>;
  valorTotalDemanda: number;
}

interface ValidateCentrosCustoResult {
  isValid: boolean;
  error?: string;
}

/**
 * Caso de uso: validar se a soma dos valores dos centros de custo
 * é exatamente igual ao valor total da demanda.
 */
export function validateCentrosCustoUseCase(
  input: ValidateCentrosCustoInput
): ValidateCentrosCustoResult {
  const { centrosCusto, valorTotalDemanda } = input;

  // Se não há centros de custo, não precisa validar
  if (!centrosCusto || centrosCusto.length === 0) {
    return { isValid: true };
  }

  // Validar que todos os centros de custo têm nome
  const centrosSemNome = centrosCusto.filter(
    (cc) => !cc.centroDeCusto || cc.centroDeCusto.trim() === ""
  );
  if (centrosSemNome.length > 0) {
    return {
      isValid: false,
      error: "Todos os centros de custo devem ter um nome selecionado.",
    };
  }

  // Calcular soma dos valores dos centros de custo
  const somaCentrosCusto = centrosCusto.reduce((acc, cc) => acc + cc.valor, 0);

  // Validar que a soma seja exatamente igual ao valor total da demanda
  const diferenca = Math.abs(valorTotalDemanda - somaCentrosCusto);
  const tolerancia = 0.01; // Tolerância para arredondamento de ponto flutuante

  if (diferenca > tolerancia) {
    const formatCurrency = (v: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

    if (somaCentrosCusto > valorTotalDemanda) {
      return {
        isValid: false,
        error: `A soma dos valores dos centros de custo (${formatCurrency(
          somaCentrosCusto
        )}) é maior que o valor total da demanda (${formatCurrency(
          valorTotalDemanda
        )}).`,
      };
    } else {
      return {
        isValid: false,
        error: `A soma dos valores dos centros de custo (${formatCurrency(
          somaCentrosCusto
        )}) é menor que o valor total da demanda (${formatCurrency(
          valorTotalDemanda
        )}).`,
      };
    }
  }

  return { isValid: true };
}
