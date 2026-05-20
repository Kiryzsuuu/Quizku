@echo off
chcp 65001 >nul 2>&1
title Kaji.in — Setup Pertama Kali
color 0B

echo.
echo  =====================================================
echo   KAJI.IN — SETUP PERTAMA KALI
echo  =====================================================
echo.
echo  Script ini akan:
echo    1. Mengecek instalasi Node.js
echo    2. Menginstall semua dependensi npm
echo    3. Memverifikasi file konfigurasi .env
echo    4. Menjalankan server Kaji.in
echo.
echo  =====================================================
echo.
pause

:: ── Check Node.js ─────────────────────────────────────────────
echo.
echo  [LANGKAH 1] Memeriksa Node.js...
echo  -------------------------------------------------
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  [GAGAL] Node.js tidak terinstall di komputer ini!
    echo.
    echo  Download Node.js LTS dari:
    echo    https://nodejs.org/en/download
    echo.
    echo  Setelah install Node.js, jalankan ulang setup ini.
    echo.
    pause
    start https://nodejs.org/en/download
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% terinstall

:: Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [GAGAL] npm tidak ditemukan!
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo  [OK] npm v%NPM_VER% terinstall

:: ── Install dependencies ───────────────────────────────────────
echo.
echo  [LANGKAH 2] Menginstall dependensi npm...
echo  -------------------------------------------------
if exist "node_modules\" (
    echo  node_modules sudah ada.
    set /p REINSTALL="  Reinstall ulang? (y/N): "
    if /i "%REINSTALL%"=="y" (
        echo  Menghapus node_modules lama...
        rmdir /s /q node_modules
        del package-lock.json >nul 2>&1
    ) else (
        echo  Lewati install.
        goto check_env
    )
)

echo  Menginstall paket...
echo.
npm install
if errorlevel 1 (
    color 0C
    echo.
    echo  [GAGAL] npm install gagal!
    echo  Pastikan koneksi internet aktif dan coba lagi.
    echo.
    pause
    exit /b 1
)
echo.
echo  [OK] Semua dependensi berhasil diinstall!

:check_env
:: ── Check / Create .env ────────────────────────────────────────
echo.
echo  [LANGKAH 3] Memeriksa file konfigurasi .env...
echo  -------------------------------------------------
if exist ".env" (
    echo  [OK] File .env ditemukan
    echo.
    echo  Isi .env saat ini:
    echo  ------------------
    type .env
    echo  ------------------
    echo.
    set /p EDIT_ENV="  Edit .env sekarang? (y/N): "
    if /i "%EDIT_ENV%"=="y" notepad .env
) else (
    echo  [!] File .env tidak ditemukan, membuat baru...
    echo.

    :: Create .env interactively
    echo PORT=3000> .env

    echo.
    echo  Masukkan MongoDB URI (dari MongoDB Atlas):
    echo  Contoh: mongodb+srv://user:pass@cluster.mongodb.net/kajiin
    set /p MONGO_URI="  MONGODB_URI= "
    echo MONGODB_URI=%MONGO_URI%>> .env

    :: Generate a simple JWT secret from timestamp
    for /f "tokens=*" %%t in ('powershell -command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N')"') do set JWT_SEC=%%t
    echo JWT_SECRET=%JWT_SEC%>> .env

    echo.
    echo  [OK] File .env berhasil dibuat!
    echo.
    type .env
    echo.
)

:: ── Final check ────────────────────────────────────────────────
echo.
echo  [LANGKAH 4] Verifikasi akhir...
echo  -------------------------------------------------

:: Check all required files exist
set MISSING=0
for %%f in (server.js socket.js public\index.html public\js\app.js public\css\shared.css) do (
    if not exist "%%f" (
        echo  [!] File tidak ditemukan: %%f
        set MISSING=1
    )
)
if "%MISSING%"=="1" (
    color 0E
    echo.
    echo  Beberapa file proyek tidak ditemukan.
    echo  Pastikan kamu menjalankan setup ini di folder Kaji.in yang benar.
    echo.
    pause
)

color 0A
echo.
echo  =====================================================
echo   SETUP SELESAI! Kaji.in siap dijalankan.
echo  =====================================================
echo.
echo  Untuk menjalankan Kaji.in:
echo    Klik dua kali   : mulai.bat
echo    Atau command    : npm start
echo.
echo  Akses aplikasi   : http://localhost:3000
echo  Admin panel      : http://localhost:3000/admin.html
echo  Login admin      : maskiryz23@gmail.com / opet123
echo.
echo  =====================================================
echo.
set /p START_NOW="  Jalankan server sekarang? (Y/n): "
if /i not "%START_NOW%"=="n" (
    color 0D
    echo.
    echo  Memulai Kaji.in...
    start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"
    npm start
)

pause
