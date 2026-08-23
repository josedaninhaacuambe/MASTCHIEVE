#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MASTCHIEVE IA — Script de deploy (executar no servidor)
# Uso: bash deploy/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e
APP_DIR="/var/www/mastchieve"
echo "🚀 Deploy Mastchieve IA — $(date '+%Y-%m-%d %H:%M:%S')"

# ── API (NestJS) ──────────────────────────────────────────────────────────────
echo ""
echo "▶ A compilar API..."
cd "$APP_DIR/apps/api"

cp .env.production .env
pnpm install --frozen-lockfile
pnpm run build

echo "▶ A executar migrações da base de dados..."
pnpm exec prisma migrate deploy

echo "▶ A reiniciar API..."
sudo systemctl restart mastchieve-api

# ── Web (Next.js) ─────────────────────────────────────────────────────────────
echo ""
echo "▶ A compilar Web..."
cd "$APP_DIR/apps/web"

cp .env.production .env.local
pnpm install --frozen-lockfile
pnpm run build

echo "▶ A reiniciar Web..."
sudo systemctl restart mastchieve-web

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo " API:  https://api.mastchieve.co.mz/api/v1"
echo " Web:  https://mastchieve.co.mz"
echo " Logs: journalctl -u mastchieve-api -f   |   journalctl -u mastchieve-web -f"
echo ""
sudo systemctl status mastchieve-api mastchieve-web --no-pager
