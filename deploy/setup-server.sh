#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MASTCHIEVE IA — Script de instalação no servidor Ubuntu 22.04
# Executar como root: bash setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "======================================================"
echo " Mastchieve IA — Setup Servidor de Produção"
echo " Domínio: mastchieve.co.mz"
echo "======================================================"

# ── 1. Actualizar sistema ──────────────────────────────────────────────────────
echo "[1/10] A actualizar o sistema..."
apt-get update -y && apt-get upgrade -y

# ── 2. Instalar dependências base ─────────────────────────────────────────────
echo "[2/10] A instalar dependências..."
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw \
  build-essential postgresql postgresql-contrib redis-server

# ── 3. Node.js 20 LTS ─────────────────────────────────────────────────────────
echo "[3/10] A instalar Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2 pnpm

# ── 4. Firewall ───────────────────────────────────────────────────────────────
echo "[4/10] A configurar firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 5. PostgreSQL ─────────────────────────────────────────────────────────────
echo "[5/10] A configurar PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

# Criar utilizador e base de dados
sudo -u postgres psql <<SQL
CREATE USER mastchieve_user WITH PASSWORD 'ALTERAR_ESTA_SENHA_FORTE';
CREATE DATABASE mastchieve_prod WITH OWNER = mastchieve_user ENCODING = 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE mastchieve_prod TO mastchieve_user;
SQL

echo "✓ PostgreSQL configurado"

# ── 6. Redis ──────────────────────────────────────────────────────────────────
echo "[6/10] A configurar Redis..."
systemctl enable redis-server
systemctl start redis-server

# Configurar senha Redis
sed -i 's/# requirepass foobared/requirepass ALTERAR_SENHA_REDIS/' /etc/redis/redis.conf
systemctl restart redis-server
echo "✓ Redis configurado"

# ── 7. Directórios da aplicação ───────────────────────────────────────────────
echo "[7/10] A criar directórios..."
mkdir -p /var/www/mastchieve
mkdir -p /var/www/mastchieve/uploads
mkdir -p /var/log/mastchieve
chown -R www-data:www-data /var/www/mastchieve/uploads

# ── 8. Nginx ──────────────────────────────────────────────────────────────────
echo "[8/10] A configurar Nginx..."
cp deploy/nginx/mastchieve.co.mz.conf /etc/nginx/sites-available/mastchieve.co.mz
ln -sf /etc/nginx/sites-available/mastchieve.co.mz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 9. SSL (Let's Encrypt) ────────────────────────────────────────────────────
echo "[9/10] A obter certificado SSL..."
certbot --nginx -d mastchieve.co.mz -d www.mastchieve.co.mz -d api.mastchieve.co.mz \
  --non-interactive --agree-tos --email admin@mastchieve.co.mz
echo "✓ SSL configurado"

# ── 10. PM2 (auto-start) ──────────────────────────────────────────────────────
echo "[10/10] A configurar PM2..."
pm2 startup systemd -u root --hp /root
echo "✓ PM2 configurado para auto-start"

echo ""
echo "======================================================"
echo " ✅ Servidor configurado com sucesso!"
echo "======================================================"
echo ""
echo " Próximos passos:"
echo " 1. Copiar ficheiros para /var/www/mastchieve/"
echo " 2. Configurar /var/www/mastchieve/apps/api/.env.production"
echo " 3. Configurar /var/www/mastchieve/apps/web/.env.production"
echo " 4. Executar: bash deploy/deploy.sh"
echo ""
