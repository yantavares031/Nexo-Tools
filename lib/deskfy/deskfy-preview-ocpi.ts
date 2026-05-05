import type { DemandaImportadaPreview } from "@/lib/deskfy/deskfy-workflow-import-preview.types";

/** OC/PI usado na importação e persistido em `demandas.ocPi` (alinhado à API Deskfy: `codigo`). */
export function getOcPiFromDeskfyPreview(item: DemandaImportadaPreview): string {
  if (item.codigo?.trim().toUpperCase().startsWith("SEB-")) {
    return item.codigo.trim();
  }
  return `SEB-${item.id}`;
}

/** Chave para comparar com `ocPi` já salvo (trim + maiúsculas). */
export function getNormalizedOcPiKeyFromDeskfyPreview(item: DemandaImportadaPreview): string {
  return getOcPiFromDeskfyPreview(item).trim().toUpperCase();
}
