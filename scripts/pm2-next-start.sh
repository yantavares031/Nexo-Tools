#!/bin/sh
set -e
# pm2-runtime / PM2 em cluster pode repassar argv extra (ex.: o path do ecosystem).
# O Next usa o 1º argumento posicional de `start` como diretório do app — não repassar "$@".
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec node "$ROOT/node_modules/next/dist/bin/next" start
