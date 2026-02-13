/**
 * Script para popular a tabela de centros de custo com dados únicos.
 * Executar: npx tsx DB/seed-centros-custo.ts
 */
import { getDb, closeDb } from "./db";
import { randomUUID } from "crypto";

// Lista de centros de custo (já processada e sem duplicatas)
const centrosCusto = [
  "MA - 2025 - ROTA DAS EMOÇÕES - CONEXÕES TRANSFORMADORAS - Ação: Rota Competitiva",
  "Projeto: MA – 2025 – Desenvolvimento da Inovação - Ação: Gestão e Monitoramento",
  "Projeto : Cidade Empreendedora Ação : Sala do Empreendedor",
  "Projeto: MA - 2025 - Conexão Mercado Ação: Eventos de Negócios",
  "MARKETING",
  "MA - 2025 - GESTÃO DE PESSOAS NEGÓCIOS / EDUCAÇÃO CORPORATIVA - NEGÓCIOS",
  "PROJETO: Faz Teu Nome - Ação: Estudantes Educação Ensino Médio",
  "Projeto: 00795 - MA - 2025 - REPOSICIONAMENTO  Ação: PARCEIRO SEBRAE (AQUISIÇÃO DE MOBILIÁRIO, EQUIPAMENTO E IDENTIDADE VISUAL)",
  "00658 - MA - 2025 - ATENDIMENTO UN LENÇÓIS E DELTA // GESTÃO E MONITORAMENTO",
  "00651 - MA - 2025 - ATENDIMENTO UNE - 000001 - ATENDIMENTO ESPECIALIZADO",
  "ACE PRODUÇÃO",
  "ACE / MKT",
  "Proj to: 00795 - MA - 2025 - REPOSICIONAMENTO - Ação: 000004 - PARCEIRO SEBRAE (AQUISIÇÃO DE MOBILIÁRIO, EQUIPAMENTO E IDEN)",
  "Projeto: Reposicionamento - Ação: Sala do Empreendedor",
  "726 - MA - 2025 - ATENDIMENTO UN SANTA INÊS - 003 - GESTÃO E MONITORAMENTO DE PROJETO",
  "00611 - MA - 2025 - ATENDIMENTO UN MUNIM // Gestão e Monitoramento",
  "Rateio",
  "PROJETO: MA- 2025- ATENDIMENTO UN PINHEIRO - AÇÃO: ATENDIMENTO ESPECIALIZADO",
  "MA - 2025 - Desenvolvimento da Inovação - Consultoria e Capacitação",
  "MA - 2025 - Territórios Empreendedores",
  "MA - 2025 - Rota das Emoções - Conexões Transformadoras - Ação Gestão e Monitoramento",
  "CUSTO INTERNO - MA - 2025 - MARKETING ESTRATÉGICO - 000001 - GESTÃO DE TRÁFEGO E IMPULSIONAMENTO",
  "MA - 2025 - MARKETING ESTRATÉGICO - 000001 - GESTÃO DE TRÁFEGO E IMPULSIONAMENTO",
  "CIDADE EMPREENDEDORA 2025 - GESTÃO E POLÍTICAS PÚBLICAS",
  "00989 - MA - 2025 - PRÓ CATADORES - 000005 - GESTÃO E MONITORAMENTO - 436 - MA - UNIDADE DE AMBIENTE DE NEGÓCIOS",
  "ASCOM PRODUÇÃO",
  "MA-MARKETING ESTRATÉGICO - Ação: GESTÃO DE TRÁFEGO E IMPULSIONAMENTO",
  "MA - Gestão de Pessoas - Programa de Qualidade de Vida no Trabalho",
  "Projeto FAZ TEU NOME - Ação ATENDIMENTO ESTIDANTES ENS MEDIO",
  "Projeto: Reposicionamento  - Ação: parceiro Sebrae",
  "Projeto: Cidade Empreendedora 2025 - Ação: Transformar Juntos",
  "MA - 2025 - Atendimento UN São Luís  - Ação - Oportunidade de negócio",
  "00553 - MA - 2025 - DESENVOLVIMENTO DA INOVAÇÃO - Ação: Gestão do Sebraetec",
  "MA - 2025 ATENDIMENTO UN SÃO LUIS  Ação: Gestão e Monitorament",
  "MA 2025 AgroMaranhão Região Tocantina - Gestão e Monitoramento",
  "PROJETO:  MA - 2025 - DTI - TURISMO GRANDE SÃO LUÍS - AÇÃO:  MARKETING",
  "Criança esperaça (Olha na aba CANETAS)",
  "2 CENTRO DE CUSTO",
  "CIDADE EMPREENDEDORA 2025 - SALA DO EMPREENDEDOR",
  "Projeto MA - 2025 - Atendimento UN São Luís   Ação Capacitaçã",
  "ASCOM",
  "CIDADE EMPREENDEDORA 2025 - COMPRAS PÚBLICAS",
  "Cidade Empreendedora 2025 - Simplificação",
  "00634 - MA - 2025 - ATENDIMENTO UN BACABAL - 000002 - CAPACITAÇÕES",
  "Projeto: MA-2025-INTELIGÊNCIA DE DADOS DO MARANHÃO - Ação: GESTÃO E MONITORAMENT",
  "Projeto: 00529 - MA-2025 - POLICY LABS - Ação: Design Sprint - Fase II",
  "MA - 2025 - ATENDIMENTO UN SANTA INÊS - GESTÃO E MONITORAMENTO DE PROJETO",
  "CUSTO INTERNO",
  "mkt",
  "Cidade Empreendedora 2025 Compras Públicas",
  "Cidade Empreendedora 2025 Simplificação",
  "Markting Estratégico - Gestão de Tráfego e Impulsionamento",
  "00732 - MA-2025-CIDADE EMPREENDEDORA - TRANSFORMAR JUNTOS MA",
  "00726 - MA - 2025 - ATENDIMENTO UN SANTA INÊS - AÇÃO - GESTÃO E MONITORAMENTO DE PROJETO",
  "Agromaranhão Vale Pindaré  - Gestão e Monitoramento de Projeto",
  "MA- Credito Orientado e Assistido - Ação: Seminário e Rodada de credito",
  "Atendimento UNE - atendimento especializado",
  "PROJETO: MA-2025 - TERITORIOS EMPREENDEDORES - AÇÃO: GESTÃO DE NEGOCIOS",
  "PROJETO: MA-2025_EDUCAÇÃOQUETRANSFORMA AÇÃO: GESTÃO E MONITORMANETO UNIDADE EMPREENDEDORA TERRITORIAL-UET",
  "Projeto: 00550–MA – 2025_FAZ TEU NOME; - Ação: 000004 – Atendimento Estudantes Ensino Fundamental",
  "Manutenção de infraestrutura  - manutenção sede",
  "Projeto de Atendimento UNE- Ação consultoria especializada",
  "Projeto: MA - 2025 - Atendimento UN São Luís - Ação: Capacitação.",
  "MA 2025  Agromaranhão Região Tocantina- Gestão e Monitoramento",
  "Projeto: Atendimento Munim - Ação: Atendimento Especializado",
  "Projeto: MA-2025- Atendimento UN Pinheiro Ação: Capacitação",
  "Projeto - MA - UN São Luís Multicenter - Atendimento - Ação - Oportunidade de Negócios",
  "MA - PROTÓTIPOS E PROJEÇÕES ESTRATÉGICAS - ,Sustentabilidade e Governança ESG",
  "Projeto: MA-2025- atendimento UN Pinheiro - Ação: capacitação",
  "Ali Rural - Gestão e monitoramento",
  "PROJETO EDUCACAO QUE TRANSFORMA - ACAO PROFISSIONAIS DA EDUCACAO",
  "MA-Crédito Orientado e Assistido - Ação: Ação de Crédito",
  "Projeto :  Cidade Empreendedora 2025  - ação : Gestão e Monitoramento",
  "00529 - MA-2025-POLICY LABS | Design Sprint - Fase II",
  "ATENDIMENTO UN PINHEIRO | ATENDIMENTO ESPECIALIZADO",
  "Projeto:MA-2025 - Atendimento UN Pinheiro| Ação: Capacitação",
  "Projeto:  MA - 2025 - DTI TURISMO GRANDE SÃO LUÍS | Ação: GESTÃO E MONITORAMENTO",
  "Projeto: Atendimento UN Chapadinha = Ação:Gestao e monitoramento",
  "Projeto: DTI Munim | Ação: Gestão e Monitoramento",
  "Projeto: Cidade Empreendedora Ação: Gestão de Monitoramento",
  "945 - MA - 2025 - SUPORTE DE NEGÓCIOS DE SANTA INÊS - 001 - SUPORTE UN SANTA INÊS",
  "Projeto: Cidade Empreendedora  - Ação: Caravana Transformar Juntos",
  "Projeto Sebrae Delas Sede MA 2025",
  "Projeto: MA - 2025 - DESENVOLVIMENTO DA INOVAÇÃO - Ação: GESTÃO DO SEBRAETEC",
  "Cidade Empreendedora 2025 Sala do Empreendedor",
  "00881 - MA-2025-DTI CHAPADA DAS MESAS - Gestão e Monitoramento",
  "Cidade Empreendedora 2025 - Gestão e Políticas Públicas",
  "618 - MA - 2025 - AGROMARANHÃO VALE PINDARÉ - 002 - GESTÃO E MONITORAMENTO DE PROJETO",
  "MA - 2025 - ATENDIMENTO UN SANTA INÊS - GESTÃO DE MONITORAMENTO DO PROJETO",
  "MA - 2025 - Atendimento UN Pinheiro - Atendimento Especializado",
  "PROTOTIPOS E PROJEÇÕES ESTRATEGICAS - PROTOTIPOS E PROJETOS ESTRATEGICOS",
  "Projeto - 00684 - MA - 2025 - ATENDIMENTO UN IMPERATRIZ - Ação - 000002 - CAPACITAÇÕES",
  "Projeto: MA_Educação que Transforma 2025 - Ação: Gestão e Monitoramento",
  "Projeto: atendimento Bacabal 2025 Ação: capacitação",
  "MA - atendimento UN CAXIAS - AÇÃO: CAPACITAÇÕES",
  "PROJETO: MA-2025_EDUCAÇÃOQUETRANSFORMA - AÇÃO: GESTÃO E MONITORMANETO UNIDADE EMPREENDEDORA TERRITORIAL-UET",
  "MA - 2025 - AGROMARANHÃO VALE PINDARE - JUNTOS PELO AGRO",
  "MA - 2025 - Atendimento Imperatriz Gestão e Monitoramento",
  "PROJETO: ATENDIMENTO UN BACABAL - AÇÃO; ATENDIMENTO ESPECIALIZADO",
  "Atendimento Chapadinha 2025 Gestao e monitoramento",
  " Atendimento UN Imperatriz Gestão e Monitoramento",
  "Cidade Empreendedora 2025 - Compras Públicas",
  "MA- Credito Orientado e Assistido - Ação: Seminário e Rodada de credito",
  "PROJETO: MA-2025_EDUCAÇÃOQUETRANSFORMA AÇÃO: GESTÃO E MONITORMANETO UNIDADE EMPREENDEDORA TERRITORIAL-UET",
  "Projeto: 00550–MA – 2025_FAZ TEU NOME; - Ação: 000004 – Atendimento Estudantes Ensino Fundamental",
  "MA - 2025 - ATENDIMENTO UN SANTA INÊS GESTÃO E MONITORAMENTO DE PROJETO",
  "Projeto de Atendimento UNE- Ação consultoria especializada",
  "MA 2025  Agromaranhão Região Tocantina- Gestão e Monitoramento",
  "Projeto: Atendimento Munim - Ação: Atendimento Especializado",
  "ASCOM - CONEXÃO COM CLIENTES",
  "Projeto: MA-2025- Atendimento UN Pinheiro Ação: Capacitação",
  "Projeto - MA - UN São Luís Multicenter - Atendimento - Ação - Oportunidade de Negócios",
  "MA - PROTÓTIPOS E PROJEÇÕES ESTRATÉGICAS - ,Sustentabilidade e Governança ESG",
  "Projeto: MA-2025- atendimento UN Pinheiro - Ação: capacitação",
  "Ali Rural - Gestão e monitoramento",
  "PROJETO EDUCACAO QUE TRANSFORMA - ACAO PROFISSIONAIS DA EDUCACAO",
  "00553 - MA - 2025 - DESENVOLVIMENTO DA INOVAÇÃO - Gestão do Sebraetec",
  "MA-Crédito Orientado e Assistido - Ação: Ação de Crédito",
  "Projeto :  Cidade Empreendedora 2025  - ação : Gestão e Monitoramento",
  "00553 - MA - 2025 - DESENVOLVIMENTO DA INOVAÇÃO Gestão do Sebraetec",
  "00529 - MA-2025-POLICY LABS | Design Sprint - Fase II",
  "ATENDIMENTO UN PINHEIRO | ATENDIMENTO ESPECIALIZADO",
  "Projeto:MA-2025 - Atendimento UN Pinheiro| Ação: Capacitação",
  "Projeto:  MA - 2025 - DTI TURISMO GRANDE SÃO LUÍS | Ação: GESTÃO E MONITORAMENTO",
  "Projeto: Atendimento UN Chapadinha = Ação:Gestao e monitoramento",
  "Projeto: DTI Munim | Ação: Gestão e Monitoramento",
  "MA - 2025 - SEBRAE DELAS / DELAS SEDE",
  "MA - 2025 - Mobiliza SLZ - Geração de Negócios",
  "Projeto: MA - 2025 - HUMANIZAR - CULTURA ORGANIZACIONAL | Ação: Employee Experience",
  "Projeto: MA - 2025 - HUMANIZAR - CULTURA ORGANIZACIONAL | Ação: Fortalecimento da Cultura",
];

function seedCentrosCusto() {
  const db = getDb();

  // Remover duplicatas (case-insensitive) e normalizar
  const uniqueCentros = new Map<string, string>();
  
  for (const nome of centrosCusto) {
    const normalized = nome.trim();
    if (normalized) {
      const key = normalized.toLowerCase();
      // Manter a primeira ocorrência (com a capitalização original)
      if (!uniqueCentros.has(key)) {
        uniqueCentros.set(key, normalized);
      }
    }
  }

  const centrosUnicos = Array.from(uniqueCentros.values());

  const insertCentroCusto = db.prepare(`
    INSERT OR IGNORE INTO centros_custo (id, nome, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  const insertMany = db.transaction(() => {
    for (const nome of centrosUnicos) {
      const id = randomUUID();
      insertCentroCusto.run(id, nome, now, now);
    }
  });

  insertMany();
  
  console.log(`Seed de centros de custo concluído: ${centrosUnicos.length} centros de custo inseridos.`);
  console.log(`Total de itens processados: ${centrosCusto.length}`);
  console.log(`Duplicatas removidas: ${centrosCusto.length - centrosUnicos.length}`);
  
  closeDb();
}

seedCentrosCusto();
