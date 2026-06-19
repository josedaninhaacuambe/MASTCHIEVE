# Mastchieve IA — Guia de Deploy: TurboHost cPanel

**Domínio:** mastchieve.co.mz  
**Painel:** cPanel (TurboHost / CloudLinux + LiteSpeed)  
**Base de dados:** MySQL (cPanel MySQL Databases)  
**Redis:** Upstash (cloud gratuito)

---

## Arquitectura final

```
Internet
    │
    ▼
LiteSpeed/Apache (cPanel AutoSSL)
    │
    ├── mastchieve.co.mz      → Node.js App (Next.js)  porta cPanel
    └── api.mastchieve.co.mz  → Node.js App (NestJS)   porta cPanel
                                          │
                                    MySQL (localhost:3306)
                                    Upstash Redis (cloud)
```

---

## PASSO 1 — Criar subdomínio para a API

1. cPanel → **Domains** → **Subdomains**
2. Criar: `api` → domínio `mastchieve.co.mz`
3. Document root sugerido: `domains/api.mastchieve.co.mz/public_html`
4. Clicar **Create**

---

## PASSO 2 — Base de dados MySQL

1. cPanel → **Databases** → **MySQL Databases**
2. **Create New Database**: `mastchieve_prod`  
   *(o cPanel vai prefixar com o teu utilizador, ex: `mastcvku_mastchieve_prod`)*
3. **Create New User**: utilizador `mastdb` + senha forte  
   *(ficará como `mastcvku_mastdb`)*
4. **Add User to Database** → seleccionar utilizador + base de dados → **All Privileges**
5. Anotar:
   - Nome da BD: `mastcvku_mastchieve_prod`
   - Utilizador: `mastcvku_mastdb`
   - Senha: (a que definiste)
   - Host: `localhost`

---

## PASSO 3 — Upstash Redis (gratuito)

1. Aceder a **https://upstash.com** → criar conta grátis
2. Console → **Create Database**
   - Nome: `mastchieve`
   - Região: `eu-west-1` (Europa, mais próxima)
   - Type: `Regional`
3. Após criar → copiar o **Redis URL** (começa com `rediss://`)
4. Guardar o URL para usar no `.env.production` da API

---

## PASSO 4 — Extrair o projecto no servidor

Via **File Manager** do cPanel:

1. O ficheiro `Mastchieve_IA.rar` já está em `domains/mastchieve.co.mz/`
2. Clicar com botão direito no ficheiro → **Extract**
3. Após extrair, deverás ter uma pasta como `Mastchieve_IA/`
4. Dentro dessa pasta, verificar que existe `apps/api/` e `apps/web/`

**Mover os ficheiros para uma localização limpa:**

Via SSH (Terminal):
```bash
# Ligar por SSH (cPanel → Terminal ou cliente SSH)
# Criar pasta de trabalho fora do public_html
mkdir -p ~/mastchieve

# Mover os ficheiros da app (ajustar o caminho se necessário)
cp -r ~/domains/mastchieve.co.mz/Mastchieve_IA/apps ~/mastchieve/
cp -r ~/domains/mastchieve.co.mz/Mastchieve_IA/deploy ~/mastchieve/

# Criar pasta de uploads
mkdir -p ~/mastchieve/uploads

# Verificar estrutura
ls ~/mastchieve/
# Deve mostrar: apps/  deploy/  uploads/
```

---

## PASSO 5 — Configurar variáveis de ambiente

### API (`~/mastchieve/apps/api/.env.production`)

Via SSH:
```bash
cp ~/mastchieve/apps/api/.env.production ~/mastchieve/apps/api/.env
nano ~/mastchieve/apps/api/.env
```

Preencher os valores em branco:

```env
# Substituir pelos valores reais do PASSO 2 e PASSO 3
DATABASE_URL="mysql://mastcvku_mastdb:SENHA_DB@localhost:3306/mastcvku_mastchieve_prod"
REDIS_URL=rediss://default:SENHA_UPSTASH@SEU-ENDPOINT.upstash.io:6379
ANTHROPIC_API_KEY=sk-ant-...
SMTP_PASS=senha_app_gmail
UPLOAD_DEST=/home/mastcvku/mastchieve/uploads
```

### Web (`~/mastchieve/apps/web/.env.local`)

```bash
cp ~/mastchieve/apps/web/.env.production ~/mastchieve/apps/web/.env.local
```

Este ficheiro já está preenchido com os URLs correctos — não precisa de alterações.

---

## PASSO 6 — Instalar dependências e compilar

Via SSH:
```bash
# Verificar Node.js disponível
node --version   # deve ser 18+ ou 20+

# ── API ──────────────────────────────────────────────────────────
cd ~/mastchieve/apps/api

npm install
npm run build

# Executar migrações (cria as tabelas no MySQL)
npx prisma migrate deploy
# Se pedir confirmação: y

# ── Web ──────────────────────────────────────────────────────────
cd ~/mastchieve/apps/web

npm install
npm run build
```

> **Nota:** Se o comando `npm` não estiver disponível, pode ser necessário
> activar o Node.js primeiro via cPanel Node.js Selector (passo seguinte).
> Nesse caso, usa o Terminal do cPanel dentro da app Node.js.

---

## PASSO 7 — Configurar Node.js Apps no cPanel

### App da API (NestJS)

1. cPanel → **Software** → **Setup Node.js App**
2. Clicar **Create Application**
3. Preencher:
   - **Node.js version**: `20` (ou a mais recente disponível)
   - **Application mode**: `Production`
   - **Application root**: `mastchieve/apps/api`
   - **Application URL**: `api.mastchieve.co.mz`
   - **Application startup file**: `dist/main.js`
4. Clicar **Create**
5. Na página da app criada → **Run NPM Install** (se ainda não fizeste)
6. Clicar **Start** para iniciar

### App do Web (Next.js)

1. Voltar a **Setup Node.js App** → **Create Application**
2. Preencher:
   - **Node.js version**: `20`
   - **Application mode**: `Production`
   - **Application root**: `mastchieve/apps/web`
   - **Application URL**: `mastchieve.co.mz`
   - **Application startup file**: `server.js`
3. Clicar **Create** → **Start**

> O cPanel cria automaticamente o `.htaccess` no `public_html` de cada domínio
> que faz proxy para a app Node.js. Não precisas de configurar nada manualmente.

---

## PASSO 8 — SSL (HTTPS)

O cPanel TurboHost inclui **AutoSSL** que gera certificados Let's Encrypt grátis:

1. cPanel → **Security** → **SSL/TLS Status**
2. Seleccionar `mastchieve.co.mz` e `api.mastchieve.co.mz`
3. Clicar **Run AutoSSL**
4. Aguardar alguns minutos — o certificado é instalado automaticamente

---

## PASSO 9 — Google OAuth (produção)

No **Google Cloud Console** (https://console.cloud.google.com):

1. APIs & Services → Credentials → seleccionar o OAuth 2.0 Client
2. Em **Authorized JavaScript origins** adicionar:
   ```
   https://mastchieve.co.mz
   ```
3. Em **Authorized redirect URIs** adicionar:
   ```
   https://mastchieve.co.mz
   ```
4. **Save**

---

## Verificar se está a funcionar

| URL | Resultado esperado |
|---|---|
| `https://mastchieve.co.mz` | Página de login |
| `https://api.mastchieve.co.mz/api/v1` | `{"message":"Cannot GET /api/v1","statusCode":404}` |

**Login inicial:**
- Email: `admin@mastchieve.co.mz`
- Senha: `Admin@Mastchieve2025`
- **Alterar imediatamente no perfil!**

---

## Comandos SSH úteis

```bash
# Ver estado das apps Node.js (cPanel gere via Passenger)
# Entrar na pasta e reiniciar via cPanel, ou:

# Ver logs da API
tail -f ~/mastchieve/apps/api/logs/app.log 2>/dev/null || \
  tail -f ~/.cpanel/logs/node_apps.log

# Reiniciar app (via cPanel Node.js Selector → Restart)
# Ou via SSH:
touch ~/mastchieve/apps/api/tmp/restart.txt  # Passenger reinicia automaticamente

# Re-executar migrações após actualização
cd ~/mastchieve/apps/api && npx prisma migrate deploy

# Verificar variáveis de ambiente
cd ~/mastchieve/apps/api && node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL?.split('@')[1])"
```

---

## Actualizar a aplicação no futuro

```bash
# 1. Fazer upload do novo .rar via File Manager e extrair
# 2. Via SSH:

cd ~/mastchieve/apps/api
npm install
npm run build
npx prisma migrate deploy

cd ~/mastchieve/apps/web
npm install
npm run build

# 3. cPanel → Setup Node.js App → Restart em ambas as apps
```

---

## Problemas comuns

| Problema | Solução |
|---|---|
| "Application failed to start" | Ver logs → verificar `.env` está correcto |
| MySQL "Access denied" | Verificar utilizador tem permissão na BD (passo 2.4) |
| "Cannot connect to Redis" | Verificar REDIS_URL do Upstash no `.env` |
| Página em branco | `npm run build` não foi executado no web |
| API retorna 502 | A app NestJS não iniciou — ver startup file `dist/main.js` |
| Uploads falham | Verificar caminho `UPLOAD_DEST` e permissões da pasta |
