/**
 * Logging estruturado (Pino, JSON). **Apenas servidor** — não importar em Client Components.
 */
export {
  appLogger,
  resolveAppLogFilePath,
  APP_LOG_MAX_READ_BYTES,
} from "@/lib/logger/app-logger";
export {
  readAppLogTail,
  getAppLogFilePath,
  APP_LOG_READ_MAX_BYTES,
} from "@/lib/logger/read-app-log";
export type { ReadAppLogTailResult } from "@/lib/logger/read-app-log";
