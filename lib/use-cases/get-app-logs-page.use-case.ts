import {
  readAppLogTail,
  APP_LOG_READ_MAX_BYTES,
} from "@/lib/logger/read-app-log";

export type ParsedLogLine =
  | {
      ok: true;
      raw: string;
      json: Record<string, unknown>;
      /** Epoch ms para ordenação */
      sortTime: number;
    }
  | { ok: false; raw: string; sortTime: number };

function extractSortTime(json: Record<string, unknown>): number {
  const t = json.time;
  if (typeof t === "number" && !Number.isNaN(t)) return t;
  if (typeof t === "string") {
    const n = Date.parse(t);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseContentToLines(content: string): ParsedLogLine[] {
  const lines = content.split("\n").filter((l) => l.length > 0);
  return lines.map((raw) => {
    try {
      const json = JSON.parse(raw) as Record<string, unknown>;
      return {
        ok: true,
        raw,
        json,
        sortTime: extractSortTime(json),
      };
    } catch {
      return { ok: false, raw, sortTime: 0 };
    }
  });
}

function lineMatchesQuery(line: ParsedLogLine, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (line.raw.toLowerCase().includes(needle)) return true;
  if (line.ok) {
    try {
      return JSON.stringify(line.json).toLowerCase().includes(needle);
    } catch {
      return false;
    }
  }
  return false;
}

export type GetAppLogsPageInput = {
  page: number;
  pageSize: number;
  query?: string;
};

export type GetAppLogsPageResult = {
  lines: ParsedLogLine[];
  page: number;
  pageSize: number;
  totalLines: number;
  totalPages: number;
  truncatedSnapshot: boolean;
  totalFileSize: number;
  logPath: string;
};

/**
 * Lê o tail do arquivo (até APP_LOG_READ_MAX_BYTES), parseia linhas JSON (Pino),
 * filtra, ordena por `time` (mais recente primeiro) e pagina em memória.
 */
export async function getAppLogsPageUseCase(
  input: GetAppLogsPageInput
): Promise<GetAppLogsPageResult> {
  const pageSize = Math.min(
    500,
    Math.max(1, Math.floor(input.pageSize) || 100)
  );
  const {
    content,
    truncated: truncatedSnapshot,
    totalSize,
    path: logPath,
  } = await readAppLogTail(APP_LOG_READ_MAX_BYTES);

  let lines = parseContentToLines(content);
  const q = input.query?.trim();
  if (q) {
    lines = lines.filter((line) => lineMatchesQuery(line, q));
  }

  lines.sort((a, b) => b.sortTime - a.sortTime);

  const totalLines = lines.length;
  const totalPages = Math.max(1, Math.ceil(totalLines / pageSize));

  let page = Math.floor(input.page);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const start = (page - 1) * pageSize;
  const pageLines = lines.slice(start, start + pageSize);

  return {
    lines: pageLines,
    page,
    pageSize,
    totalLines,
    totalPages,
    truncatedSnapshot,
    totalFileSize: totalSize,
    logPath,
  };
}
