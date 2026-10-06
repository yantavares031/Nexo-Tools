/**
 * Jobs agendados (cron): backup e lembretes de pendências. Usado pelo serviço `backup` no docker-compose.
 * O Next roda no serviço `app` sem PM2 — evita argv/cluster do PM2 no `next start`.
 */
const CRON_BACKUP = process.env.CRON_BACKUP || "0 0 * * *";
const CRON_REMINDERS = process.env.CRON_REMINDERS || "0 8 * * *";

module.exports = {
  apps: [
    {
      name: "backup",
      script: "npx",
      args: "tsx scripts/backup.ts",
      cwd: __dirname,
      autorestart: false,
      exec_mode: "fork",
      cron_restart: CRON_BACKUP,
    },
    {
      name: "reminders",
      script: "npx",
      args: "tsx scripts/send-pending-reminders.ts",
      cwd: __dirname,
      autorestart: false,
      exec_mode: "fork",
      cron_restart: CRON_REMINDERS,
    },
  ],
};
