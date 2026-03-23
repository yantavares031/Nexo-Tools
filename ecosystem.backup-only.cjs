/**
 * Só o job de backup (cron). Usado pelo serviço `backup` no docker-compose.
 * O Next roda no serviço `app` sem PM2 — evita argv/cluster do PM2 no `next start`.
 */
const CRON_BACKUP = process.env.CRON_BACKUP || "0 0 * * *";

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
  ],
};
