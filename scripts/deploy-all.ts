/**
 * Orquestra deploy: bump de versão, login Docker Hub (PAT), push da imagem, deploy via SSH e push GitHub.
 *
 * Flags:
 * - `--ssh-only` — pula bump, login/push local e github:push; executa só SSH com `docker login` no servidor antes do compose pull.
 *
 * Requer `sshpass` no PATH (macOS: brew install hudochenkov/sshpass/sshpass).
 * Senha SSH: defina DEPLOY_SSH_PASSWORD no .env (não commitar).
 * Docker Hub: defina DOCKERHUB_TOKEN (PAT) no .env; opcional DOCKERHUB_USERNAME (padrão: yantavares021 — mesmo usuário da imagem).
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

/** Trecho seguro para uso dentro de aspas simples em bash remoto. */
function bashSingleQuoted(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** No servidor: login no Docker Hub e depois compose (pull precisa estar autenticado). */
function buildRemoteDeployCommand(dockerUser: string, dockerToken: string): string {
  const login = `printf '%s\\n' ${bashSingleQuoted(dockerToken)} | docker login -u ${bashSingleQuoted(dockerUser)} --password-stdin`;
  const compose = `docker compose down && docker compose pull && docker compose up -d`;
  return `${login} && ${compose}`;
}

function main(): void {
  const sshOnly = process.argv.includes("--ssh-only");

  const sshPassword = process.env.DEPLOY_SSH_PASSWORD?.trim();
  if (!sshPassword) {
    console.error(
      "deploy-all: defina DEPLOY_SSH_PASSWORD no arquivo .env (senha SSH para yan@nexo.sebraelinks.com)."
    );
    process.exit(1);
  }

  const dockerUser = process.env.DOCKERHUB_USERNAME?.trim() || "yantavares021";
  const dockerToken = process.env.DOCKERHUB_TOKEN?.trim();
  if (!dockerToken) {
    console.error(
      "deploy-all: defina DOCKERHUB_TOKEN no .env (Personal Access Token do Docker Hub para docker login local e no servidor SSH)."
    );
    process.exit(1);
  }

  assertSshpass();

  if (!sshOnly) {
    console.log("\n→ npm run version:bump\n");
    runOrFail("npm run version:bump");

    console.log("\n→ docker login\n");
    const dockerLogin = spawnSync(
      "docker",
      ["login", "-u", dockerUser, "--password-stdin"],
      {
        input: `${dockerToken}\n`,
        encoding: "utf8",
        stdio: ["pipe", "inherit", "inherit"],
      }
    );
    if (dockerLogin.error) {
      console.error(dockerLogin.error.message);
      process.exit(1);
    }
    if (dockerLogin.status !== 0) {
      process.exit(dockerLogin.status ?? 1);
    }

    console.log("\n→ npm run docker:push\n");
    runOrFail("npm run docker:push");
  } else {
    console.log("\n→ modo --ssh-only (pulando bump, docker login local, docker:push)\n");
  }

  const remoteCmd = buildRemoteDeployCommand(dockerUser, dockerToken);
  console.log(
    "\n→ SSH: docker login (remoto) + docker compose down && pull && up -d\n"
  );
  const ssh = spawnSync(
    "sshpass",
    [
      "-p",
      sshPassword,
      "ssh",
      "-o",
      "StrictHostKeyChecking=accept-new",
      "yan@nexo.sebraelinks.com",
      remoteCmd,
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

  if (!sshOnly) {
    console.log("\n→ npm run github:push\n");
    runOrFail("npm run github:push");
  }

  console.log(`\n✅ deploy-all concluído${sshOnly ? " (ssh-only)" : ""}.\n`);
}

main();
