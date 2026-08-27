#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MASTCHIEVE IA — Setup inicial do VPS novo (Ubuntu 22.04/24.04 + Docker)
# Executar UMA VEZ, como root: bash deploy/setup-vps-docker.sh
#
# Pressupostos:
#   - VPS novo, acesso root por SSH (ex.: 187.7.16.162)
#   - Repositório git já tem remote configurado e é acessível a partir do VPS
#   - DNS de mastchieve.co.mz ainda pode não apontar para este VPS — os
#     passos de SSL/certbot ficam no fim e podem ser adiados sem problema
# ─────────────────────────────────────────────────────────────────────────────

set -e

REPO_URL="https://github.com/josedaninhaacuambe/MASTCHIEVE.git"
APP_DIR="/var/www/mastchieve"

echo "======================================================"
echo " Mastchieve IA — Setup VPS (Docker)"
echo "======================================================"

# ── 1. Sistema base ────────────────────────────────────────────────────────
echo "[1/9] A actualizar o sistema e instalar dependências base..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx ca-certificates gnupg

# ── 2. Docker Engine + Compose plugin ──────────────────────────────────────
echo "[2/9] A instalar Docker..."
if ! command -v docker &> /dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable docker
systemctl start docker
echo "✓ Docker instalado: $(docker --version)"

# ── 3. Firewall ─────────────────────────────────────────────────────────────
echo "[3/9] A configurar firewall (só 22, 80, 443 ficam expostas)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 4. Obter o código ────────────────────────────────────────────────────────
echo "[4/9] A obter o código do repositório..."
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin master
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 5. Ficheiros de configuração (.env) ─────────────────────────────────────
echo "[5/9] A preparar ficheiros de configuração..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.docker.example" "$APP_DIR/.env"
  echo "⚠  Criado $APP_DIR/.env com valores de exemplo — EDITAR AGORA com senhas fortes:"
  echo "   nano $APP_DIR/.env"
fi
if [ ! -f "$APP_DIR/apps/api/.env.production" ]; then
  echo "⚠  Falta $APP_DIR/apps/api/.env.production — copiar do servidor antigo ou de .env.example e preencher."
fi
if [ ! -f "$APP_DIR/apps/web/.env.production" ]; then
  echo "⚠  Falta $APP_DIR/apps/web/.env.production — copiar do servidor antigo ou de .env.example e preencher."
fi
echo ""
echo "   >>> Parar aqui se os .env acima ainda não estiverem preenchidos. <<<"
echo "   Depois de preencher, correr o resto manualmente (passos 6-9 abaixo,"
echo "   também disponíveis em deploy/deploy-docker.sh para deploys seguintes)."
echo ""
read -p "Os três ficheiros .env já estão preenchidos com valores reais? [s/N] " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
  echo "A terminar. Preencha os .env e corra novamente."
  exit 0
fi

# ── 6. Infra (MySQL, Redis, phpMyAdmin) ─────────────────────────────────────
echo "[6/9] A arrancar MySQL, Redis e phpMyAdmin..."
cd "$APP_DIR"
docker compose -f docker-compose.prod.yml up -d mysql redis phpmyadmin
echo "A aguardar que o MySQL fique saudável..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' mastchieve_mysql)" = "healthy" ]; do
  sleep 3
done
echo "✓ Infra pronta"

# ── 7. Build das imagens da aplicação ───────────────────────────────────────
echo "[7/9] A construir as imagens Backend e Web..."
set -a
source <(grep -E '^NEXT_PUBLIC_' apps/web/.env.production)
set +a
docker compose -f docker-compose.prod.yml build backend web

# ── 8. Migrações da base de dados + arranque ────────────────────────────────
echo "[8/9] A executar migrações Prisma e a arrancar Backend/Web..."
docker compose -f docker-compose.prod.yml run --rm --no-deps backend npx prisma migrate deploy
cp deploy/systemd/mastchieve-backend.service /etc/systemd/system/
cp deploy/systemd/mastchieve-web.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable mastchieve-backend mastchieve-web
systemctl start mastchieve-backend
systemctl start mastchieve-web

# ── 9. Nginx + SSL ───────────────────────────────────────────────────────────
echo "[9/9] A configurar Nginx (SSL fica pendente até o DNS apontar para cá)..."
cp deploy/nginx/mastchieve.co.mz.conf /etc/nginx/sites-available/mastchieve.co.mz
ln -sf /etc/nginx/sites-available/mastchieve.co.mz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx || echo "⚠  nginx -t falhou — provavelmente porque ainda não há certificado SSL. Ver nota abaixo."

echo ""
echo "======================================================"
echo " ✅ VPS configurado!"
echo "======================================================"
echo ""
echo " Enquanto o DNS de mastchieve.co.mz não apontar para 187.7.16.162:"
echo "   - Testar directamente via IP: http://187.7.16.162:4300 (web) e :4301 (api)"
echo "     (o nginx com SSL só fica activo depois do certbot correr com sucesso)"
echo ""
echo " Quando o DNS já apontar para este VPS, gerar o certificado SSL:"
echo "   certbot --nginx --redirect -d mastchieve.co.mz -d www.mastchieve.co.mz -d api.mastchieve.co.mz \\"
echo "     --non-interactive --agree-tos --email admin@mastchieve.co.mz"
echo ""
echo " phpMyAdmin (nunca exposto publicamente) — aceder via túnel SSH:"
echo "   ssh -L 8081:127.0.0.1:8081 root@187.7.16.162"
echo "   depois abrir http://localhost:8081 no browser local"
echo ""
echo " Gerir os serviços:"
echo "   sudo systemctl start|stop|restart|status mastchieve-backend"
echo "   sudo systemctl start|stop|restart|status mastchieve-web"
echo ""
echo " Para levar a mesma base de dados do servidor antigo, ver:"
echo "   deploy/db-export-mysql.sh (correr no servidor antigo)"
echo "   deploy/db-import-docker.sh (correr aqui, neste VPS)"
echo ""
