/**
 * Orquestra deploy: build/push da imagem Docker, deploy via SSH no servidor e push para o GitHub.
 *
 * Requer `sshpass` no PATH (macOS: brew install hudochenkov/sshpass/sshpass).
 * Senha SSH: defina DEPLOY_SSH_PASSWORD no .env (não commitar).
 */

import { config } from "dotenv";
import { execSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

function assertSshpass(): void {
  const r = spawnSync("which", ["sshpass"], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error(
      "deploy-all: `sshpass` não encontrado. Instale (ex.: macOS: brew install hudochenkov/sshpass/sshpass) e tente de novo."
    );
    process.exit(1);
  }
}

function runOrFail(command: string): void {
  execSync(command, { stdio: "inherit", cwd: process.cwd() });
}

function main(): void {
  const password = process.env.DEPLOY_SSH_PASSWORD?.trim();
  if (!password) {
    console.error(
      "deploy-all: defina DEPLOY_SSH_PASSWORD no arquivo .env (senha SSH para yan@nexo.sebraelinks.com)."
    );
    process.exit(1);
  }

  assertSshpass();

  console.log("\n-> npm run docker:push\n");
  runOrFail("npm run docker:push");

  console.log(
    "\n-> SSH: docker compose down && docker compose pull && docker compose up -d\n"
  );
  const ssh = spawnSync(
    "sshpass",
    [
      "-p",
      password,
      "ssh",
      "-o",
      "StrictHostKeyChecking=accept-new",
      "yan@nexo.sebraelinks.com",
      "docker compose down && docker compose pull && docker compose up -d",
    ],
    { stdio: "inherit" }
  );

  if (ssh.error) {
    console.error(ssh.error.message);
    process.exit(1);
  }
  if (ssh.status !== 0) {
    process.exit(ssh.status ?? 1);
  }

  console.log("\n-> npm run github:push\n");
  runOrFail("npm run github:push");

  console.log("\nDeploy concluido.\n");
}

main();
