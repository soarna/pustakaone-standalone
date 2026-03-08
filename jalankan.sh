#!/bin/bash
echo ""
echo "========================================"
echo "  PustakaOne v2 - Perpustakaan Digital"
echo "========================================"
echo ""

# Cek Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js tidak ditemukan."
    echo ""
    echo "    Install Node.js dari: https://nodejs.org"
    echo "    Atau gunakan package manager:"
    echo "      Ubuntu/Debian : sudo apt install nodejs npm"
    echo "      Mac (Homebrew): brew install node"
    echo ""
    exit 1
fi

echo "[OK] Node.js ditemukan: $(node --version)"

# Install dependensi jika belum ada
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[..] Menginstal dependensi (hanya perlu sekali)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[!] Gagal menginstal dependensi."
        exit 1
    fi
    echo "[OK] Dependensi berhasil diinstal."
fi

echo ""
echo "[..] Menjalankan server..."
echo "     URL  : http://localhost:3000"
echo "     Email: admin@pustakaone.com"
echo "     Pass : admin123"
echo ""
echo "     (Tekan Ctrl+C untuk menghentikan)"
echo "----------------------------------------"

# Buka browser (coba berbagai cara)
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    open http://localhost:3000 &
fi

# Jalankan server
export AUTO_OPEN=0
node server/index.js
