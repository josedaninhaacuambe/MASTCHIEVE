@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: MASTCHIEVE IA — Deploy / Actualização (Windows + XAMPP)
:: Executar como Administrador sempre que houver actualizações
:: Uso: Abrir CMD como Admin → deploy\windows\2-deploy.bat
:: ─────────────────────────────────────────────────────────────────────────────
title Mastchieve IA - Deploy

setlocal
set APP_DIR=C:\mastchieve

echo ======================================================
echo  Mastchieve IA - Deploy
echo  %DATE% %TIME%
echo ======================================================
echo.

:: Verificar se a pasta existe
if not exist "%APP_DIR%" (
    echo [ERRO] Pasta %APP_DIR% nao encontrada!
    echo Copiar primeiro os ficheiros do projeto para %APP_DIR%
    pause
    exit /b 1
)

:: ── API (NestJS) ──────────────────────────────────────────────────────────────
echo [API] A compilar NestJS...
cd /d "%APP_DIR%\apps\api"

:: Copiar .env.production para .env
if exist ".env.production" (
    copy /Y ".env.production" ".env"
    echo [OK] .env copiado de .env.production
) else (
    echo [AVISO] .env.production nao encontrado - certifique-se que o .env esta configurado
)

echo [API] A instalar dependencias...
call pnpm install --frozen-lockfile
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias da API
    pause
    exit /b 1
)

echo [API] A compilar TypeScript...
call pnpm run build
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao compilar a API
    pause
    exit /b 1
)
echo [OK] API compilada

echo [API] A executar migracoes da base de dados...
call pnpm exec prisma migrate deploy
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Migracoes falharam - verificar ligacao ao MySQL
    echo         Continuar de qualquer forma? (S para sim)
    set /p continuar=
    if /i not "%continuar%"=="S" exit /b 1
)
echo [OK] Migracoes executadas

echo [API] A reiniciar processo...
pm2 restart mastchieve-api >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] A iniciar API pela primeira vez...
    pm2 start dist/main.js --name mastchieve-api --env production
)
echo [OK] API a correr na porta 4301

echo.

:: ── Web (Next.js) ─────────────────────────────────────────────────────────────
echo [WEB] A compilar Next.js...
cd /d "%APP_DIR%\apps\web"

:: Copiar .env.production para .env.local
if exist ".env.production" (
    copy /Y ".env.production" ".env.local"
    echo [OK] .env.local copiado de .env.production
)

echo [WEB] A instalar dependencias...
call pnpm install --frozen-lockfile
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do Web
    pause
    exit /b 1
)

echo [WEB] A compilar Next.js (pode demorar alguns minutos)...
call pnpm run build
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao compilar o Next.js
    pause
    exit /b 1
)
echo [OK] Web compilado

echo [WEB] A reiniciar processo...
pm2 restart mastchieve-web >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] A iniciar Web pela primeira vez...
    pm2 start node_modules\.bin\next --name mastchieve-web --interpreter none -- start -p 4300
)
echo [OK] Web a correr na porta 4300

:: ── Guardar estado PM2 ────────────────────────────────────────────────────────
echo.
echo A guardar configuracao PM2...
pm2 save
echo [OK] PM2 guardado

echo.
echo ======================================================
echo  Deploy concluido com sucesso!
echo ======================================================
echo.
echo  API:  https://api.mastchieve.co.mz
echo  Web:  https://mastchieve.co.mz
echo.
echo  Estado dos processos:
pm2 list
echo.
echo  Ver logs em tempo real: pm2 logs
echo  Ver logs da API:        pm2 logs mastchieve-api
echo  Ver logs do Web:        pm2 logs mastchieve-web
echo.
pause
endlocal
