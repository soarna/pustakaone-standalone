@echo off
chcp 65001 >nul 2>&1
title PustakaOne v2

echo.
echo ========================================
echo   PustakaOne v2 - Perpustakaan Digital
echo ========================================
echo.

:: Selalu pakai Node.js portable dari folder ini
set NODE_DIR=%~dp0node_portable\node-v20.11.0-win-x64
set NODE_EXE=%NODE_DIR%\node.exe
set NPM_CMD=%NODE_DIR%\npm.cmd

:: Jika node portable belum ada, download sekarang
if not exist "%NODE_EXE%" (
    echo [..] Menyiapkan Node.js portable, mohon tunggu...
    if not exist "%~dp0node_portable" mkdir "%~dp0node_portable"
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "[Net.ServicePointManager]::SecurityProtocol='Tls12';" ^
      "Write-Host 'Mengunduh Node.js (~30MB)...';" ^
      "Invoke-WebRequest 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile '%~dp0node_portable\node.zip' -UseBasicParsing;" ^
      "Write-Host 'Mengekstrak...';" ^
      "Expand-Archive '%~dp0node_portable\node.zip' -DestinationPath '%~dp0node_portable' -Force;" ^
      "Remove-Item '%~dp0node_portable\node.zip' -Force;" ^
      "Write-Host 'Selesai!'"
    if not exist "%NODE_EXE%" (
        echo.
        echo [!] Gagal menyiapkan Node.js.
        echo     Pastikan ada koneksi internet lalu coba lagi.
        echo.
        pause
        exit /b 1
    )
    echo [OK] Node.js siap.
)

:: Jika node_modules belum ada, install paket
if not exist "%~dp0node_modules\express\index.js" (
    echo [..] Menyiapkan paket aplikasi, mohon tunggu...
    cd /d "%~dp0"
    "%NPM_CMD%" install
    if %errorlevel% NEQ 0 (
        echo [!] Gagal menyiapkan paket. Pastikan ada koneksi internet.
        pause
        exit /b 1
    )
    echo [OK] Paket siap.
)

:: Jalankan server
echo.
echo [OK] Semua siap! Menjalankan PustakaOne...
echo.
echo     URL      : http://localhost:3000
echo     Email    : admin@pustakaone.com
echo     Password : admin123
echo.
echo     Browser akan terbuka otomatis.
echo     Tutup jendela ini untuk menghentikan aplikasi.
echo ----------------------------------------
echo.

cd /d "%~dp0"
"%NODE_EXE%" server\index.js
if %errorlevel% NEQ 0 (
    echo.
    echo [!] Server berhenti. Lihat pesan error di atas.
)
pause
