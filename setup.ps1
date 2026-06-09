# Mastchieve IA - Setup Script (Windows/PowerShell)
# Portas isoladas para coexistir com outros projetos em desenvolvimento

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Mastchieve IA - Setup Completo" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Portas reservadas para este projecto:" -ForegroundColor Yellow
Write-Host "  Web (Next.js):  http://localhost:4300" -ForegroundColor White
Write-Host "  API (NestJS):   http://localhost:4301" -ForegroundColor White
Write-Host "  Swagger:        http://localhost:4301/api/docs" -ForegroundColor White
Write-Host "  n8n:            http://localhost:5791" -ForegroundColor White
Write-Host "  Nginx:          http://localhost:4390" -ForegroundColor White
Write-Host "  PostgreSQL:     localhost:5491" -ForegroundColor White
Write-Host "  Redis:          localhost:6491" -ForegroundColor White
Write-Host ""

# Check Node
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERRO: Node.js nao encontrado. Instala em https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "OK Node.js: $nodeVersion" -ForegroundColor Green

# Check Docker
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "ERRO: Docker nao encontrado. Instala em https://docker.com" -ForegroundColor Red
    exit 1
}
Write-Host "OK Docker: $dockerVersion" -ForegroundColor Green

# Verificar conflito de portas
Write-Host ""
Write-Host "Verificando conflitos de portas..." -ForegroundColor Cyan
$portasParaVerificar = @(4300, 4301, 5491, 6491, 5791, 4390)
$conflito = $false
foreach ($porta in $portasParaVerificar) {
    $emUso = netstat -ano | Select-String ":$porta " | Select-String "LISTENING"
    if ($emUso) {
        Write-Host "AVISO: Porta $porta ja esta em uso!" -ForegroundColor Red
        $conflito = $true
    } else {
        Write-Host "OK Porta $porta disponivel" -ForegroundColor Green
    }
}
if ($conflito) {
    Write-Host ""
    Write-Host "AVISO: Algumas portas estao ocupadas. Verifica os processos antes de continuar." -ForegroundColor Yellow
}

# Criar .env da API se nao existir
Write-Host ""
if (-not (Test-Path "apps/api/.env")) {
    Copy-Item "apps/api/.env.example" "apps/api/.env"
    Write-Host "AVISO: .env criado em apps/api/.env" -ForegroundColor Yellow
    Write-Host "       Edita o ficheiro e adiciona o ANTHROPIC_API_KEY!" -ForegroundColor Yellow
}

# Criar .env.local do Web se nao existir
if (-not (Test-Path "apps/web/.env.local")) {
    @"
NEXT_PUBLIC_API_URL=http://localhost:4301/api
NEXT_PUBLIC_WS_URL=ws://localhost:4301
"@ | Out-File "apps/web/.env.local" -Encoding utf8
    Write-Host "OK .env.local criado em apps/web/.env.local" -ForegroundColor Green
}

# Instalar dependencias
Write-Host ""
Write-Host "Instalando dependencias raiz..." -ForegroundColor Cyan
npm install

Write-Host "Instalando dependencias da API..." -ForegroundColor Cyan
Set-Location "apps/api"
npm install
Set-Location "../.."

Write-Host "Instalando dependencias do Web..." -ForegroundColor Cyan
Set-Location "apps/web"
npm install
Set-Location "../.."

# Iniciar Docker
Write-Host ""
Write-Host "Iniciando servicos Docker (postgres:5491, redis:6491)..." -ForegroundColor Cyan
docker-compose up -d postgres redis

# Aguardar PostgreSQL
Write-Host "Aguardando PostgreSQL ficar pronto..." -ForegroundColor Yellow
$tentativas = 0
do {
    Start-Sleep -Seconds 3
    $tentativas++
    $pronto = docker exec mastchieve_postgres pg_isready -U mastchieve 2>$null
} while (-not $pronto -and $tentativas -lt 10)

if ($tentativas -ge 10) {
    Write-Host "ERRO: PostgreSQL nao respondeu. Verifica os logs: docker logs mastchieve_postgres" -ForegroundColor Red
    exit 1
}
Write-Host "OK PostgreSQL pronto" -ForegroundColor Green

# Prisma
Write-Host ""
Write-Host "Executando migracoes Prisma..." -ForegroundColor Cyan
Set-Location "apps/api"
npx prisma generate
npx prisma migrate dev --name init
Write-Host "Executando seed..." -ForegroundColor Cyan
npx ts-node prisma/seed.ts
Set-Location "../.."

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Setup concluido com sucesso!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para arrancar o projecto:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (API):" -ForegroundColor Yellow
Write-Host "    cd apps/api" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 2 (Web):" -ForegroundColor Yellow
Write-Host "    cd apps/web" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Ou iniciar tudo:" -ForegroundColor Yellow
Write-Host "    docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Dashboard:  http://localhost:4300" -ForegroundColor Cyan
Write-Host "  API Docs:   http://localhost:4301/api/docs" -ForegroundColor Cyan
Write-Host "  n8n:        http://localhost:5791" -ForegroundColor Cyan
Write-Host "  Nginx:      http://localhost:4390" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciais seed:" -ForegroundColor Yellow
Write-Host "  Admin:    admin@mastchieve.com / admin123456" -ForegroundColor White
Write-Host "  Instrutor: joao.silva@mastchieve.com / instructor123" -ForegroundColor White
Write-Host "  Atleta:   atleta1@mastchieve.com / student123" -ForegroundColor White
