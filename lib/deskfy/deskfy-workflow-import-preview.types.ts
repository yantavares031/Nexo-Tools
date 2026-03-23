export type DemandaImportadaPreview = {
  id: string;
  /** Código da solicitação na Deskfy (ex.: ABC-123). Usado para OC/PI: SEB-{id} ou codigo se já no padrão. */
  codigo: string;
  demanda: string;
  solicitante: string;
  status: string;
  board: string;
  colunaAtual: string;
  valor: string;
  mes: string;
  /** Formato YYYY-MM para input type="month". */
  mesYyyyMm: string;
};

