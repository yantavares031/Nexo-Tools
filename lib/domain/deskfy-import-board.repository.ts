export interface DeskfyImportBoard {
  id: string;
  nome: string;
}

/** Contrato do repositório de boards Deskfy permitidos na importação. */
export interface IDeskfyImportBoardRepository {
  findAll(): Promise<DeskfyImportBoard[]>;
  findByName(nome: string): Promise<DeskfyImportBoard | null>;
  create(nome: string): Promise<DeskfyImportBoard>;
  remove(id: string): Promise<void>;
}
