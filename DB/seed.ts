/**
 * Script para criar o banco e popular com dados dos JSON (se existirem).
 * Executar: npx tsx DB/seed.ts
 * 
 * Nota: Este script é opcional. Se os arquivos mock não existirem, o banco será criado vazio.
 */
import { getDb, closeDb } from "./db";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");

function loadJson<T>(filename: string): T | null {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  const raw = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(raw) as T;
}

interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: string;
  agenciaId?: string;
}

interface Agencia {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  orcamentoAnual: number;
}

interface Solicitante {
  id: string;
  nome: string;
  unResponsavel: string;
}

interface Demanda {
  id: string;
  demanda: string;
  solicitante: string;
  unResponsavel: string;
  obs: string;
  status: string;
  valor: number;
  centroDeCusto: string;
  ocPi: string;
  mes: string;
  agencia?: string;
  agenciaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

function seed() {
  const db = getDb();

  const users = loadJson<User[]>("users.mock.json") ?? [];
  const agencias = loadJson<Agencia[]>("agencias.mock.json") ?? [];
  const solicitantes = loadJson<Solicitante[]>("solicitantes.mock.json") ?? [];
  const demandas = loadJson<Demanda[]>("demandas.mock.json") ?? [];
  const unidades = loadJson<string[]>("unidades.mock.json") ?? [];

  if (users.length === 0 && agencias.length === 0 && solicitantes.length === 0 && demandas.length === 0 && unidades.length === 0) {
    console.log("Nenhum arquivo mock encontrado. Banco criado vazio.");
    closeDb();
    return;
  }

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password, name, role, agenciaId)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertAgencia = db.prepare(`
    INSERT OR REPLACE INTO agencias (id, nomeFantasia, cnpj, orcamentoAnual)
    VALUES (?, ?, ?, ?)
  `);

  const insertSolicitante = db.prepare(`
    INSERT OR REPLACE INTO solicitantes (id, nome, unResponsavel)
    VALUES (?, ?, ?)
  `);

  const insertUnidade = db.prepare(`
    INSERT OR REPLACE INTO unidades (nome) VALUES (?)
  `);

  const insertDemanda = db.prepare(`
    INSERT OR REPLACE INTO demandas (
      id, demanda, solicitante, unResponsavel, obs, status, valor,
      centroDeCusto, ocPi, mes, agencia, agenciaId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const un of unidades) {
      insertUnidade.run(un);
    }
    for (const u of users) {
      insertUser.run(u.id, u.email, u.password, u.name ?? null, u.role, u.agenciaId ?? null);
    }
    for (const a of agencias) {
      insertAgencia.run(a.id, a.nomeFantasia, a.cnpj, a.orcamentoAnual);
    }
    for (const s of solicitantes) {
      insertSolicitante.run(s.id, s.nome, s.unResponsavel);
    }
    for (const d of demandas) {
      insertDemanda.run(
        d.id,
        d.demanda,
        d.solicitante,
        d.unResponsavel,
        d.obs ?? "",
        d.status,
        d.valor,
        d.centroDeCusto ?? "",
        d.ocPi ?? "",
        d.mes ?? "",
        d.agencia ?? null,
        d.agenciaId ?? null,
        d.createdAt ?? null,
        d.updatedAt ?? null
      );
    }
  });

  insertMany();
  console.log("Seed concluído:", users.length, "users,", agencias.length, "agencias,", solicitantes.length, "solicitantes,", demandas.length, "demandas,", unidades.length, "unidades");
  closeDb();
}

seed();
