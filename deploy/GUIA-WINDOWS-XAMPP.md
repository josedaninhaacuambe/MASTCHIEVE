# Mastchieve IA — Guia de Instalação: Windows + XAMPP

**Domínio:** mastchieve.co.mz  
**Servidor:** Windows Server (XAMPP)  
**Base de dados:** MySQL/MariaDB (incluído no XAMPP)

---

## Arquitectura no servidor

```
Internet
    │
    ▼
Apache (XAMPP) — porta 80/443
    │
    ├── mastchieve.co.mz     → proxy → Node.js Next.js (porta 4300)
    └── api.mastchieve.co.mz → proxy → Node.js NestJS  (porta 4301)
                                              │
                                        MySQL (3306)
                                        Redis/Memurai (6379)
```

---

## PASSO 1 — Instalar Node.js

1. Descarregar Node.js 20 LTS: https://nodejs.org/  
   (escolher o instalador Windows .msi)
2. Instalar com opções predefinidas
3. Abrir **PowerShell como Administrador** e verificar:
   ```
   node --version   # deve mostrar v20.x.x
   npm --version
   ```

---

## PASSO 2 — Base de Dados MySQL (phpMyAdmin)

1. Abrir XAMPP Control Panel → Iniciar **MySQL**
2. Abrir browser → `http://localhost/phpmyadmin`
3. Clicar em **SQL** (aba no topo)
4. Abrir o ficheiro `deploy\database\init-mysql.sql` e colar o conteúdo
5. Clicar **Executar**

> Vai criar a base de dados `mastchieve_prod`, o utilizador `mastchieve_user` e o admin inicial.

**Alterar a senha do utilizador:**  
No init-mysql.sql substituir `ALTERAR_SENHA_DB` pela tua senha antes de executar.

---

## PASSO 3 — Copiar ficheiros para o servidor

Copiar a pasta do projecto para `C:\mastchieve\`:

```
C:\mastchieve\
├── apps\
│   ├── api\       ← NestJS
│   └── web\       ← Next.js
├── uploads\       ← ficheiros enviados pelos utilizadores
└── logs\          ← logs PM2
```

Ou usar o script de instalação:
```
deploy\windows\1-instalar.bat   (executar como Administrador)
```

---

## PASSO 4 — Configurar variáveis de ambiente

### API (`C:\mastchieve\apps\api\.env.production`)

Editar o ficheiro e preencher:

| Campo | O que preencher |
|---|---|
| `DATABASE_URL` | Substituir `ALTERAR_SENHA_DB` pela senha definida no passo 2 |
| `ANTHROPIC_API_KEY` | Obter em https://console.anthropic.com |
| `REDIS_PASSWORD` | Definir a mesma senha que configuraste no Memurai |
| `SMTP_PASS` | Gmail → Conta → Segurança → Palavras-passe de aplicação |

### Web (`C:\mastchieve\apps\web\.env.production`)

Este ficheiro já está preenchido. Verificar apenas:
```
NEXT_PUBLIC_API_URL=https://api.mastchieve.co.mz/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=317743237140-...
```

---

## PASSO 5 — Redis (para IA em background)

### Opção A — Memurai (recomendado, gratuito para dev)
1. Descarregar: https://www.memurai.com/get-memurai
2. Instalar com opções predefinidas (instala como serviço Windows)
3. Configurar senha em `C:\ProgramData\Memurai\memurai.conf`:
   ```
   requirepass ALTERAR_SENHA_REDIS
   ```
4. Reiniciar serviço: `net stop Memurai && net start Memurai`

### Opção B — Upstash Redis (cloud, sem instalação)
1. Criar conta em https://upstash.com (gratuito)
2. Criar base Redis → copiar URL
3. No `.env.production` substituir `REDIS_HOST` pelo URL do Upstash

### Sem Redis (modo degradado)
Sem Redis o feedback IA automático não funciona, mas o resto da aplicação funciona normalmente.

---

## PASSO 6 — Apache (activar mod_proxy)

### 6.1 Activar módulos
Abrir `C:\xampp\apache\conf\httpd.conf` e remover o `#` de:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule headers_module modules/mod_headers.so
```

### 6.2 Incluir vhosts (se não estiver incluído)
Verificar que esta linha existe (sem `#`) no `httpd.conf`:
```apache
Include conf/extra/httpd-vhosts.conf
```

### 6.3 Copiar configuração dos virtual hosts
Copiar `deploy\apache\httpd-vhosts.conf` para:
```
C:\xampp\apache\conf\extra\httpd-vhosts.conf
```

> **Atenção:** Substituir o conteúdo existente.

### 6.4 Reiniciar Apache
No XAMPP Control Panel → Apache → **Stop** → **Start**

---

## PASSO 7 — SSL (HTTPS)

### Instalar win-acme (Let's Encrypt para Windows)
1. Descarregar: https://www.win-acme.com/
2. Extrair para `C:\win-acme\`
3. Abrir CMD como Administrador:
   ```cmd
   cd C:\win-acme
   wacs.exe
   ```
4. Escolher opções:
   - `N` → New certificate
   - `1` → Manual input
   - Host: `mastchieve.co.mz,www.mastchieve.co.mz,api.mastchieve.co.mz`
   - Validation: HTTP (porta 80 tem de estar aberta)
   - Caminho dos certificados: `C:\letsencrypt\mastchieve.co.mz\`

5. win-acme cria uma tarefa agendada para renovação automática.

---

## PASSO 8 — Fazer o Deploy

Executar como Administrador:
```
deploy\windows\2-deploy.bat
```

Este script:
1. Instala as dependências (`pnpm install`)
2. Compila TypeScript → JavaScript
3. Executa as migrações da base de dados Prisma
4. Inicia os processos com PM2

---

## PASSO 9 — Arranque automático (reiniciar servidor)

Executar uma vez como Administrador:
```
deploy\windows\3-servico-windows.bat
```

---

## PASSO 10 — Google OAuth (produção)

No Google Cloud Console:
1. Ir a: https://console.cloud.google.com/
2. APIs & Services → Credentials → Seleccionar o OAuth Client
3. Adicionar em **Authorized JavaScript origins**:
   ```
   https://mastchieve.co.mz
   ```
4. Adicionar em **Authorized redirect URIs**:
   ```
   https://mastchieve.co.mz
   https://mastchieve.co.mz/auth/google/callback
   ```
5. Guardar

---

## Verificar se está a funcionar

Após o deploy, testar:

| URL | Resultado esperado |
|---|---|
| `https://mastchieve.co.mz` | Página de login da aplicação |
| `https://api.mastchieve.co.mz/api/v1` | `{"statusCode":404}` (API responde) |
| `https://api.mastchieve.co.mz/api/v1/auth/health` | `{"status":"ok"}` |

**Login inicial:**
- Email: `admin@mastchieve.co.mz`  
- Senha: `Admin@Mastchieve2025`  
- **Alterar imediatamente após o primeiro login!**

---

## Comandos úteis (PM2)

```cmd
pm2 list                    # ver todos os processos
pm2 logs                    # ver logs em tempo real
pm2 logs mastchieve-api     # logs só da API
pm2 restart mastchieve-api  # reiniciar API
pm2 restart mastchieve-web  # reiniciar Web
pm2 stop all                # parar tudo
pm2 monit                   # monitor interactivo
```

---

## Estrutura de portas

| Serviço | Porta | Acesso externo |
|---|---|---|
| Apache (HTTP) | 80 | Sim (redireciona para HTTPS) |
| Apache (HTTPS) | 443 | Sim |
| Next.js | 4300 | Não (só via Apache proxy) |
| NestJS API | 4301 | Não (só via Apache proxy) |
| MySQL | 3306 | Não (só local) |
| Redis/Memurai | 6379 | Não (só local) |
