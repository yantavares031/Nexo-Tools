import { z } from "zod";

export const INTEGRACOES_TABS = [
  { value: "webhooks", label: "Webhooks" },
  { value: "filtro-boards", label: "Filtro de boards" },
  { value: "deskfy", label: "Deskfy" },
  { value: "smtp", label: "Servidor SMTP" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "lembretes", label: "Lembretes" },
  { value: "capacidade", label: "Alertas de capacidade" },
] as const;

export type IntegracoesTab = (typeof INTEGRACOES_TABS)[number]["value"];

export const integracoesTabSchema = z
  .enum(INTEGRACOES_TABS.map((tab) => tab.value) as [IntegracoesTab, ...IntegracoesTab[]])
  .catch("webhooks");

export function integracoesTabHref(tab: IntegracoesTab): string {
  return tab === "webhooks" ? "/integracoes" : `/integracoes?tab=${tab}`;
}
