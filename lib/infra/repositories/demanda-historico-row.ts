import type { DemandaHistoricoAlteracao } from "@/types/globals";

export function parseHistoricoAlteracoes(raw: unknown): DemandaHistoricoAlteracao[] {
  if (raw == null || String(raw).trim() === "") return [];
  try {
    const value = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        campo: String(item.campo ?? ""),
        de: String(item.de ?? ""),
        para: String(item.para ?? ""),
      }));
  } catch {
    return [];
  }
}
