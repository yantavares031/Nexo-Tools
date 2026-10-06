/**
 * Envia os lembretes diários de pendências (OC sem assinatura e demandas sem comprovação).
 * Respeita a configuração em Integrações → Lembretes (ativo/prazos) e roda no máximo uma vez por dia.
 *
 * Uso: npm run reminders
 * Agendado pelo PM2 (CRON_REMINDERS, padrão 08:00) em ecosystem.config.cjs e ecosystem.backup-only.cjs.
 */
import "dotenv/config";
import { closeDb } from "@/DB/db";
import { isPostgres } from "@/lib/infra/db-driver";
import { closePool } from "@/lib/infra/db-pg";
import { makePendingRemindersDeps } from "@/lib/infra/pending-reminders-deps";
import { appLogger } from "@/lib/logger";
import { sendPendingRemindersUseCase } from "@/lib/use-cases/send-pending-reminders.use-case";

async function main(): Promise<void> {
  try {
    const result = await sendPendingRemindersUseCase({}, makePendingRemindersDeps());
    console.log("Lembretes de pendências:", result.skipped ?? JSON.stringify(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appLogger.error({ event: "reminders.failure", err: message }, "Falha nos lembretes de pendências");
    console.error("Falha nos lembretes de pendências:", message);
    process.exitCode = 1;
  } finally {
    if (isPostgres()) {
      await closePool().catch(() => undefined);
    } else {
      closeDb();
    }
  }
}

void main();
