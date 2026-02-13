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
  getDemandaCentroCustoRepository,
  getCentroCustoRepository,
  getDemandaMensagemRepository,
  getWebhookConfigRepository,
} from "@/lib/infra/repositories";
export { getWebhookSender } from "@/lib/infra/webhook-sender";
