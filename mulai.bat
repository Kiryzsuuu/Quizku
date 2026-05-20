@echo off
chcp 65001 >nul 2>&1
title Kaji.in — Starter
color 0D

echo.
echo  ██╗  ██╗ █████╗      ██╗██╗    ██╗███╗   ██╗
echo  ██║ ██╔╝██╔══██╗     ██║██║    ██║████╗  ██║
echo  █████╔╝ ███████║     ██║██║    ██║██╔██╗ ██║
echo  ██╔═██╗ ██╔══██║██   ██║██║    ██║██║╚██╗██║
echo  ██║  ██╗██║  ██║╚█████╔╝██║    ██║██║ ╚████║
echo  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚════╝ ╚═╝    ╚═╝╚═╝  ╚═══╝
echo.
echo            Platform Kuis Interaktif Jepang
echo  =====================================================
echo.

:: ── Check Node.js ─────────────────────────────────────────────
echo  [1/4] Memeriksa Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [ERROR] Node.js tidak ditemukan!
    echo.
    echo  Silakan install Node.js terlebih dahulu:
    echo  https://nodejs.org/en/download
    echo.
    echo  Setelah install, jalankan kembali file ini.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo         Node.js %NODE_VER% ditemukan OK

:: ── Check .env ────────────────────────────────────────────────
echo.
echo  [2/4] Memeriksa konfigurasi .env...
if not exist ".env" (
    color 0E
    echo.
    echo  [PERHATIAN] File .env tidak ditemukan!
    echo  Membuat .env dari template...
    echo.
    copy ".env.example" ".env" >nul 2>&1
    if errorlevel 1 (
        echo PORT=3000> .env
        echo MONGODB_URI=masukkan-uri-mongodb-atlas-disini>> .env
        echo JWT_SECRET=ganti-dengan-random-string-panjang>> .env
    )
    color 0E
    echo  [!] File .env telah dibuat. Harap edit file .env
    echo      dan isi MONGODB_URI sebelum menjalankan aplikasi.
    echo.
    notepad .env
    pause
    color 0D
)
echo         File .env ditemukan OK

:: ── Install dependencies ───────────────────────────────────────
echo.
echo  [3/4] Memeriksa dependensi npm...
if not exist "node_modules\" (
    echo         node_modules tidak ada, menginstall...
    echo.
    npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo  [ERROR] npm install gagal! Periksa koneksi internet.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo         Dependensi berhasil diinstall!
) else (
    echo         node_modules sudah ada, lewati install
)

:: ── Open browser & start server ────────────────────────────────
echo.
echo  [4/4] Memulai server...
echo.
echo  =====================================================
echo   Kaji.in berjalan di: http://localhost:3000
echo   Admin panel       : http://localhost:3000/admin.html
echo   Email admin       : maskiryz23@gmail.com
echo   Password admin    : opet123
echo  =====================================================
echo.
echo  Tekan Ctrl+C untuk menghentikan server.
echo.

:: Check if port 3000 is already in use
netstat -an | find "0.0.0.0:3000" >nul 2>&1
if not errorlevel 1 (
    color 0E
    echo  [!] Port 3000 sudah dipakai. Server mungkin sudah berjalan.
    echo.
    set /p FORCE="  Hentikan proses lama dan mulai ulang? (Y/n): "
    if /i not "%FORCE%"=="n" (
        for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000 "') do (
            taskkill /f /pid %%p >nul 2>&1
        )
        echo  Proses lama dihentikan. Memulai ulang...
        timeout /t 1 >nul
    ) else (
        echo  Membuka browser ke server yang sudah berjalan...
        start http://localhost:3000
        pause
        exit /b 0
    )
)

color 0D
:: Open browser after 2 seconds
start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"

:: Start the server
npm start
