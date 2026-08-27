#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MASTCHIEVE IA — Exportar a base de dados MySQL actual (servidor antigo)
# Uso: bash deploy/db-export-mysql.sh
#
# Gera um ficheiro mastchieve_dump_<data>.sql pronto a copiar (scp) para o
# VPS novo e importar com deploy/db-import-docker.sh.
#
# Se este servidor não tiver o comando `mysqldump` disponível (comum em
# alguns planos cPanel), usar em alternativa: phpMyAdmin → base de dados →
# separador "Exportar" → método "Personalizado" → formato SQL → Executar.
# ─────────────────────────────────────────────────────────────────────────────

set -e

read -p "Nome da base de dados MySQL (ex.: mastchieve_prod): " DB_NAME
read -p "Utilizador MySQL: " DB_USER

OUT_FILE="mastchieve_dump_$(date '+%Y%m%d_%H%M%S').sql"

mysqldump -u "$DB_USER" -p --single-transaction --routines --triggers "$DB_NAME" > "$OUT_FILE"

echo "✓ Exportado para: $OUT_FILE"
echo ""
echo "Próximo passo — copiar para o VPS novo:"
echo "  scp $OUT_FILE root@187.7.16.162:/var/www/mastchieve/"
echo ""
echo "Depois, no VPS novo:"
echo "  bash deploy/db-import-docker.sh $OUT_FILE"
