#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MASTCHIEVE IA — Importar dump MySQL para o container Docker (VPS novo)
# Uso (no VPS, dentro de /var/www/mastchieve):
#   bash deploy/db-import-docker.sh mastchieve_dump_20260827_120000.sql
#
# Requer que o container mysql já esteja a correr:
#   docker compose -f docker-compose.prod.yml up -d mysql
# ─────────────────────────────────────────────────────────────────────────────

set -e
DUMP_FILE="$1"

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "Uso: bash deploy/db-import-docker.sh <ficheiro.sql>"
  exit 1
fi

set -a
source .env
set +a

echo "▶ A importar $DUMP_FILE para a base de dados $MYSQL_DATABASE..."
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$DUMP_FILE"

echo "✅ Dados importados com sucesso para '$MYSQL_DATABASE'."
echo "   Lembrete: esta é a MESMA base de dados do servidor antigo — planear"
echo "   a limpeza/reset depois de validar tudo neste VPS."
