import path from "path";
import { readFile } from "fs/promises";
import fs from "fs";
import {
  deleteAppObjectFromR2,
  getAppObjectBufferFromR2,
  isR2AppObjectKey,
} from "@/lib/r2-upload";

/** Lê bytes do R2 (keys com prefixo comprovacoes/ ou ordens-compra/) ou do disco legado. */
export async function readStoredUploadFile(
  caminhoArquivo: string,
  legacyLocalDir: string
): Promise<Buffer> {
  if (isR2AppObjectKey(caminhoArquivo)) {
    return getAppObjectBufferFromR2(caminhoArquivo);
  }
  return readFile(path.join(legacyLocalDir, caminhoArquivo));
}

export async function deleteStoredUploadFile(
  caminhoArquivo: string,
  legacyLocalDir: string
): Promise<void> {
  if (isR2AppObjectKey(caminhoArquivo)) {
    await deleteAppObjectFromR2(caminhoArquivo);
    return;
  }
  const local = path.join(legacyLocalDir, caminhoArquivo);
  if (fs.existsSync(local)) {
    fs.unlinkSync(local);
  }
}
