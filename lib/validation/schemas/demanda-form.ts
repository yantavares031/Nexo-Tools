import { z } from "zod";

const statusSchema = z.enum(["faturado", "comprometido", "entregue"], {
  error: () => "Status inválido.",
});

const centrosCustoItemSchema = z.object({
  centroDeCusto: z.string(),
  valor: z.number(),
  ordem: z.number(),
});

export function formDataToDemandaRaw(formData: FormData) {
  return {
    demanda: String(formData.get("demanda") ?? ""),
    solicitante: String(formData.get("solicitante") ?? ""),
    unResponsavel: String(formData.get("unResponsavel") ?? ""),
    obs: String(formData.get("obs") ?? ""),
    status: String(formData.get("status") ?? "comprometido"),
    valor: String(formData.get("valor") ?? ""),
    centroDeCusto: String(formData.get("centroDeCusto") ?? ""),
    ocPi: String(formData.get("ocPi") ?? ""),
    mes: String(formData.get("mes") ?? ""),
    agencia: String(formData.get("agencia") ?? ""),
    centrosCustoJson: formData.get("centrosCusto") as string | null,
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };
}

export const demandaFormFieldsSchema = z.object({
  demanda: z.string().trim().min(1, "Demanda, solicitante e unidade responsável são obrigatórios."),
  solicitante: z.string().trim().min(1, "Demanda, solicitante e unidade responsável são obrigatórios."),
  unResponsavel: z.string().trim().min(1, "Demanda, solicitante e unidade responsável são obrigatórios."),
  obs: z.string().trim(),
  status: statusSchema,
  valor: z.string(),
  centroDeCusto: z.string().trim(),
  ocPi: z.string().trim(),
  mes: z.string().trim(),
  agencia: z
    .string()
    .trim()
    .transform((s) => (s === "" ? undefined : s)),
  centrosCustoJson: z.union([z.string(), z.null()]).optional(),
  redirectTo: z.string().trim(),
});

export type DemandaFormFieldsParsed = z.infer<typeof demandaFormFieldsSchema>;

/** Parse JSON de centros de custo (fronteira); retorno `null` = ausente ou array vazio. */
export function parseCentrosCustoJson(
  raw: string | null | undefined
): { ok: true; data: z.infer<typeof centrosCustoItemSchema>[] } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, data: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Erro ao processar os centros de custo." };
  }
  const arr = z.array(centrosCustoItemSchema).safeParse(parsed);
  if (!arr.success) {
    return { ok: false, error: "Erro ao processar os centros de custo." };
  }
  return { ok: true, data: arr.data };
}
