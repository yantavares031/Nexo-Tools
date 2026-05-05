# Publicar no Docker Hub (linux/amd64): npm run docker:push
# (Não misture com "docker buildx ..." na mesma linha; o script já inclui contexto "." e --push.)
# Build local carregando a imagem (sem push): npm run docker:build
# ---------- STAGE 1: deps ----------
FROM node:22-alpine AS deps
WORKDIR /app

# Necessário para deps nativas (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

# ---------- STAGE 2: build ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY . .

RUN npm run build

# remove devDependencies (mantém tsx, dotenv, pg, etc.)
RUN npm prune --omit=dev

# ---------- STAGE 3: runtime ----------
FROM keymetrics/pm2:22-alpine
WORKDIR /app

LABEL org.opencontainers.image.title="nexo-tools" \
      org.opencontainers.image.url="https://hub.docker.com/r/yantavares021/nexo-tools"

RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/pm2-next-start.sh
COPY --from=builder /app/ecosystem.config.cjs ./ecosystem.config.cjs
COPY --from=builder /app/ecosystem.backup-only.cjs ./ecosystem.backup-only.cjs
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/proxy.ts ./proxy.ts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/app ./app
COPY --from=builder /app/modals ./modals
COPY --from=builder /app/services ./services
COPY --from=builder /app/types ./types
COPY --from=builder /app/production ./production
COPY --from=builder /app/DB ./DB
COPY --from=builder /app/components ./components

RUN mkdir -p /app/logs

EXPOSE 3000
# Next fora do PM2 (compose: serviço `backup` usa pm2-runtime só para o cron)
CMD ["node", "./node_modules/next/dist/bin/next", "start"]