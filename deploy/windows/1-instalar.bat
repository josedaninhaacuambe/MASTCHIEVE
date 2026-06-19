@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: MASTCHIEVE IA — Instalação no Servidor Windows + XAMPP
:: Executar como Administrador: clique direito → Executar como administrador
:: ─────────────────────────────────────────────────────────────────────────────
title Mastchieve IA - Instalação

echo ======================================================
echo  Mastchieve IA - Setup Servidor Windows + XAMPP
echo  Dominio: mastchieve.co.mz
echo ======================================================
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Instalar Node.js 20 LTS em: https://nodejs.org/
    echo Depois de instalar, fechar e reabrir esta janela.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado:
node --version

:: Verificar se npm está disponível
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] npm nao encontrado!
    pause
    exit /b 1
)

echo.
echo [1/6] A instalar PM2 (gestor de processos)...
npm install -g pm2
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar PM2
    pause
    exit /b 1
)
echo [OK] PM2 instalado

echo.
echo [2/6] A instalar pnpm (gestor de pacotes)...
npm install -g pnpm
echo [OK] pnpm instalado

echo.
echo [3/6] A criar pastas da aplicacao...
if not exist "C:\mastchieve" mkdir "C:\mastchieve"
if not exist "C:\mastchieve\uploads" mkdir "C:\mastchieve\uploads"
if not exist "C:\mastchieve\logs" mkdir "C:\mastchieve\logs"
if not exist "C:\mastchieve\apps" mkdir "C:\mastchieve\apps"
echo [OK] Pastas criadas em C:\mastchieve\

echo.
echo [4/6] A criar pastas de logs do Apache...
if not exist "C:\xampp\apache\logs" mkdir "C:\xampp\apache\logs"
echo [OK] Logs Apache prontos

echo.
echo [5/6] A configurar PM2 para iniciar com o Windows...
pm2 startup
echo.
echo IMPORTANTE: Se aparecer um comando PowerShell acima, copiar e executar
echo como Administrador para que o PM2 inicie automaticamente com o servidor.
echo.

echo.
echo [6/6] A verificar instalacao do Memurai (Redis para Windows)...
where memurai >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [AVISO] Memurai (Redis) nao encontrado.
    echo.
    echo Opcoes para Redis no Windows:
    echo   A) Memurai (recomendado): https://www.memurai.com/get-memurai
    echo   B) WSL2 + Redis oficial: Mais complexo mas mais robusto
    echo   C) Upstash Redis (cloud gratuito): https://upstash.com
    echo.
    echo Sem Redis o servico de IA (feedback automatico) nao funciona.
    echo A aplicacao web e API funcionam normalmente sem Redis.
    echo.
) else (
    echo [OK] Memurai encontrado
)

echo.
echo ======================================================
echo  Instalacao basica concluida!
echo ======================================================
echo.
echo Proximos passos:
echo.
echo 1. Base de dados MySQL (phpMyAdmin):
echo    - Abrir http://localhost/phpmyadmin
echo    - SQL: executar deploy\database\init-mysql.sql
echo.
echo 2. Apache (activar mod_proxy):
echo    - Editar C:\xampp\apache\conf\httpd.conf
echo    - Copiar deploy\apache\httpd-vhosts.conf para
echo      C:\xampp\apache\conf\extra\httpd-vhosts.conf
echo.
echo 3. SSL (Let's Encrypt):
echo    - Instalar win-acme: https://www.win-acme.com/
echo    - Executar: wacs --target manual --host mastchieve.co.mz,api.mastchieve.co.mz
echo.
echo 4. Copiar aplicacao para C:\mastchieve\
echo    - Executar: deploy\windows\2-deploy.bat
echo.
pause
