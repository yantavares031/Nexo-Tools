/**
 * Ponto de entrada dos repositórios.
 * As implementações concretas (infra) ficam em lib/infra/repositories/.
 * Reexportamos daqui para manter imports existentes (@/lib/repositories).
 */
export {
  getUserRepository,
  getDemandaRepository,
  getSolicitanteRepository,
  getAgenciaRepository,
  getDemandaComprovacaoRepository,
  getOrdemCompraRepository,
  getDemandaCentroCustoRepository,
  getCentroCustoRepository,
  getDemandaMensagemRepository,
  getWebhookConfigRepository,
  getDeskfyImportBoardRepository,
  getSmtpConfigRepository,
  getDeskfyConfigRepository,
} from "@/lib/infra/repositories";
export { getWebhookSender } from "@/lib/infra/webhook-sender";
