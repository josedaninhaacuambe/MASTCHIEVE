@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: MASTCHIEVE IA — Registar PM2 como Serviço Windows
:: Garante que a aplicação inicia automaticamente após reiniciar o servidor
:: Executar UMA VEZ como Administrador
:: ─────────────────────────────────────────────────────────────────────────────
title Mastchieve IA - Servico Windows

echo ======================================================
echo  Registar Mastchieve como Servico Windows
echo ======================================================
echo.

:: Instalar pm2-windows-service
echo A instalar pm2-windows-service...
npm install -g pm2-windows-service
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar pm2-windows-service
    echo Alternativa: usar pm2 startup e seguir instrucoes
    pause
    exit /b 1
)

:: Instalar o serviço
echo A registar servico Windows...
pm2-service-install -n "Mastchieve"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ALTERNATIVA] Usar o metodo nativo PM2:
    echo   pm2 startup
    echo   (copiar e executar o comando que aparecer)
    echo   pm2 save
    pause
    exit /b 1
)

:: Garantir que os processos estão salvos
pm2 save

echo.
echo [OK] Servico 'Mastchieve' registado!
echo.
echo O servico inicia automaticamente quando o servidor reiniciar.
echo.
echo Gerir o servico:
echo   Iniciar:  net start Mastchieve
echo   Parar:    net stop Mastchieve
echo   Estado:   sc query Mastchieve
echo.
pause
