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
pm2 restart mastchieve-api 2>/dev/null || pm2 start dist/main.js --name mastchieve-api \
  --instances 2 --exec-mode cluster \
  --log /var/log/mastchieve/api-out.log \
  --error /var/log/mastchieve/api-error.log

# ── Web (Next.js) ─────────────────────────────────────────────────────────────
echo ""
echo "▶ A compilar Web..."
cd "$APP_DIR/apps/web"

cp .env.production .env.local
pnpm install --frozen-lockfile
pnpm run build

echo "▶ A reiniciar Web..."
pm2 restart mastchieve-web 2>/dev/null || pm2 start node_modules/.bin/next \
  --name mastchieve-web \
  --log /var/log/mastchieve/web-out.log \
  --error /var/log/mastchieve/web-error.log \
  -- start -p 4300

# ── Guardar configuração PM2 ──────────────────────────────────────────────────
pm2 save

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo " API:  https://api.mastchieve.co.mz/api/v1"
echo " Web:  https://mastchieve.co.mz"
echo " Logs: pm2 logs"
echo ""
pm2 list
