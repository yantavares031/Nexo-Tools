/**
 * PM2: servidor Next.js + backup diário.
 * Uso: pm2-runtime start ecosystem.config.cjs
 *
 * CRON_BACKUP: horário do backup (padrão: todo dia às 00:00).
 * CRON_REMINDERS: horário dos lembretes de pendências (padrão: todo dia às 08:00).
 */
const CRON_BACKUP = process.env.CRON_BACKUP || "0 0 * * *";
const CRON_REMINDERS = process.env.CRON_REMINDERS || "0 8 * * *";

module.exports = {
  apps: [
    {
      name: "nexo-tools",
      // Shell fixo: PM2 cluster / pm2-runtime pode injetar argv (ex.: ecosystem.config.cjs);
      // o Next interpreta isso como diretório do projeto e quebra (.env, .next).
      script: "./scripts/pm2-next-start.sh",
      cwd: __dirname,
      interpreter: "none",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: "production" },
    },
    {
      name: "backup",
      script: "npx",
      args: "tsx scripts/backup.ts",
      cwd: __dirname,
      autorestart: false,
      cron_restart: CRON_BACKUP,
    },
    {
      name: "reminders",
      script: "npx",
      args: "tsx scripts/send-pending-reminders.ts",
      cwd: __dirname,
      autorestart: false,
      cron_restart: CRON_REMINDERS,
    },
  ],
};
