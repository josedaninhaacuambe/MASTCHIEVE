#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MASTCHIEVE IA — Deploy de novas alterações (VPS + Docker)
# Uso (no VPS, dentro de /var/www/mastchieve): bash deploy/deploy-docker.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e
APP_DIR="/var/www/mastchieve"
cd "$APP_DIR"

echo "🚀 Deploy Mastchieve IA (Docker) — $(date '+%Y-%m-%d %H:%M:%S')"

echo ""
echo "▶ A obter alterações do git..."
git pull origin master

echo "▶ A extrair variáveis NEXT_PUBLIC_* para o build da Web..."
set -a
source <(grep -E '^NEXT_PUBLIC_' apps/web/.env.production)
set +a

echo "▶ A construir imagens Docker (backend + web)..."
docker compose -f docker-compose.prod.yml build backend web

echo "▶ A executar migrações da base de dados..."
docker compose -f docker-compose.prod.yml run --rm --no-deps backend npx prisma migrate deploy

echo "▶ A reiniciar serviços..."
sudo systemctl restart mastchieve-backend
sudo systemctl restart mastchieve-web

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo " Web:  https://mastchieve.co.mz"
echo " API:  https://api.mastchieve.co.mz/api/v1"
echo " Logs: docker compose -f docker-compose.prod.yml logs -f backend"
echo "       docker compose -f docker-compose.prod.yml logs -f web"
echo ""
sudo systemctl status mastchieve-backend mastchieve-web --no-pager
