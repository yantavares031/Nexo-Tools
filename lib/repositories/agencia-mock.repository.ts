import { writeFileSync } from "fs";
import path from "path";
import type { IAgenciaRepository } from "@/lib/domain/agencia.repository";
import type { Agencia, AgenciaInput } from "@/types/globals";

import agenciasData from "@/data/agencias.mock.json";

/** Array mutável para o mock — permite adicionar/remover agências em memória. */
const agencias = [...(agenciasData as Agencia[])];

const AGENCIAS_FILE = path.join(process.cwd(), "data", "agencias.mock.json");

function persistToFile() {
  try {
    writeFileSync(
      AGENCIAS_FILE,
      JSON.stringify(agencias, null, 2),
      "utf-8"
    );
  } catch {
    // Em ambiente serverless (ex: Vercel) o filesystem pode ser read-only
  }
}

export class AgenciaMockRepository implements IAgenciaRepository {
  async findAll(): Promise<Agencia[]> {
    return [...agencias].sort((a, b) =>
      a.nomeFantasia.localeCompare(b.nomeFantasia)
    );
  }

  async findById(id: string): Promise<Agencia | null> {
    return agencias.find((a) => a.id === id) ?? null;
  }

  async create(input: AgenciaInput): Promise<Agencia> {
    const agencia: Agencia = {
      ...input,
      id: String(Date.now()),
    };
    agencias.push(agencia);
    persistToFile();
    return agencia;
  }

  async update(id: string, input: AgenciaInput): Promise<Agencia> {
    const index = agencias.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error("Agência não encontrada");
    }
    const agencia: Agencia = { ...input, id };
    agencias[index] = agencia;
    persistToFile();
    return agencia;
  }

  async remove(id: string): Promise<void> {
    const index = agencias.findIndex((a) => a.id === id);
    if (index !== -1) {
      agencias.splice(index, 1);
      persistToFile();
    }
  }
}
