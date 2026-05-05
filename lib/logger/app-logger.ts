import fs from "fs";
import path from "path";
import pino from "pino";

/** Limite para processamento de tail (leitura administrativa). */
export const APP_LOG_MAX_READ_BYTES = 32 * 1024 * 1024;

let resolvedLogPath: string | null = null;

/**
 * Caminho absoluto do arquivo de log (mesmo usado para escrita).
 * Default: `{cwd}/logs/app.log` quando `LOG_PATH` não está definido.
 */
export function resolveAppLogFilePath(): string {
  if (resolvedLogPath) return resolvedLogPath;
  const raw = process.env.LOG_PATH?.trim();
  if (!raw) {
    resolvedLogPath = path.join(process.cwd(), "logs", "app.log");
    return resolvedLogPath;
  }
  resolvedLogPath = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  return resolvedLogPath;
}

function resolveLogLevel(): string {
  const l = process.env.LOG_LEVEL?.trim().toLowerCase();
  const allowed = ["fatal", "error", "warn", "info", "debug", "trace"];
  if (l && allowed.includes(l)) return l;
  return "info";
}

/** IANA usado no campo `time` dos logs (alinha ao servidor BR). */
const LOG_TIMEZONE = "America/Sao_Paulo";

/** Converte "GMT-03:00" / "GMT+05:30" do Intl em sufixo ISO (-03:00 / +05:30). */
function offsetSuffixForZone(date: Date, timeZone: string): string {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = dtf.formatToParts(date);
    const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = raw.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/i);
    if (!m) return "-03:00";
    const sign = m[1];
    const h = Number(m[2]);
    const min = m[3] != null ? Number(m[3]) : 0;
    return `${sign}${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  } catch {
    return "-03:00";
  }
}

function formatIsoInSaoPaulo(date: Date): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: LOG_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "";
  const y = get("year");
  const m = get("month");
  const d = get("day");
  const hh = get("hour");
  const mm = get("minute");
  const ss = get("second");
  const off = offsetSuffixForZone(date, LOG_TIMEZONE);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${off}`;
}

function saoPauloTimestamp(): string {
  return `,"time":"${formatIsoInSaoPaulo(new Date())}"`;
}

function createAppLogger(): pino.Logger {
  const level = resolveLogLevel();
  const logPath = resolveAppLogFilePath();
  const streams: pino.StreamEntry[] = [];

  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const fileStream = fs.createWriteStream(logPath, { flags: "a" });
    streams.push({ level: level as pino.Level, stream: fileStream });
  } catch (err) {
    console.warn(
      "[nexo-tools] Não foi possível abrir arquivo de log em disco; usando apenas stdout.",
      err
    );
  }

  streams.push({ level: level as pino.Level, stream: process.stdout });

  return pino(
    {
      level: level as pino.Level,
      timestamp: saoPauloTimestamp,
    },
    pino.multistream(streams)
  );
}

const globalForLogger = globalThis as unknown as {
  __nexoAppLogger?: pino.Logger;
};

/**
 * Logger singleton (JSON por linha). Só importar em código **server-side**.
 */
export const appLogger: pino.Logger =
  globalForLogger.__nexoAppLogger ?? createAppLogger();

if (process.env.NODE_ENV !== "production") {
  globalForLogger.__nexoAppLogger = appLogger;
}
