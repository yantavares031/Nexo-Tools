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
      timestamp: pino.stdTimeFunctions.isoTime,
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
