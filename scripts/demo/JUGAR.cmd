@echo off
chcp 65001 >nul
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas Node.js 24. Instalalo desde https://nodejs.org/
  pause
  exit /b 1
)
node "%~dp0server.mjs" --open
pause
