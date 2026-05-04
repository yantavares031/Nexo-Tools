import fs from "fs/promises";
import path from "path";
import {
  APP_LOG_MAX_READ_BYTES,
  resolveAppLogFilePath,
} from "@/lib/logger/app-logger";

export type ReadAppLogTailResult = {
  path: string;
  content: string;
  /** true quando o arquivo é maior que o trecho lido (só entrou o final / tail). */
  truncated: boolean;
  totalSize: number;
};

/** Default para chamadas pontuais (não usar na página admin — lá usa APP_LOG_READ_MAX_BYTES). */
const DEFAULT_TAIL_BYTES = 512 * 1024;

/**
 * Lê o arquivo de log do Pino.
 * - Se o arquivo couber em `maxBytes`, lê o arquivo inteiro (`readFile`).
 * - Se for maior, lê só os últimos `maxBytes` bytes (tail).
 * - No tail, descarta até o primeiro `\n` para não começar no meio de uma linha JSON.
 */
export async function readAppLogTail(
  maxBytes: number = DEFAULT_TAIL_BYTES
): Promise<ReadAppLogTailResult> {
  const logPath = resolveAppLogFilePath();
  const resolvedPath = path.resolve(logPath);

  let st: Awaited<ReturnType<typeof fs.stat>>;
  try {
    st = await fs.stat(logPath);
  } catch {
    return {
      path: resolvedPath,
      content: "",
      truncated: false,
      totalSize: 0,
    };
  }

  if (!st.isFile() || st.size === 0) {
    return {
      path: resolvedPath,
      content: "",
      truncated: false,
      totalSize: st.size,
    };
  }

  const maxAllowed = Math.min(maxBytes, APP_LOG_MAX_READ_BYTES);

  if (st.size <= maxAllowed) {
    const content = await fs.readFile(logPath, "utf8");
    return {
      path: resolvedPath,
      content,
      truncated: false,
      totalSize: st.size,
    };
  }

  const cap = maxAllowed;
  const start = st.size - cap;
  const fh = await fs.open(logPath, "r");
  try {
    const buf = Buffer.alloc(Number(cap));
    const { bytesRead } = await fh.read(buf, 0, buf.length, start);
    let text = buf.subarray(0, bytesRead).toString("utf8");
    const idx = text.indexOf("\n");
    if (idx !== -1) {
      text = text.slice(idx + 1);
    }
    return {
      path: resolvedPath,
      content: text,
      truncated: true,
      totalSize: st.size,
    };
  } finally {
    await fh.close();
  }
}

/** Alias semântico para o mesmo caminho usado pelo logger. */
export function getAppLogFilePath(): string {
  return resolveAppLogFilePath();
}

/** Mesmo teto de leitura administrativa (tail ou arquivo completo se couber). */
export const APP_LOG_READ_MAX_BYTES = APP_LOG_MAX_READ_BYTES;
