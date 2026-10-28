# 🚀 Quick Start - FINAL VERSION

## Jalankan Development 

### Option 1: Install Concurrently Dulu (Recommended)

Di VS Code Terminal, jalankan:
```powershell
cd d:\Holicindo\unit-passport-portal
npm install concurrently --save-dev
```

Setelah install selesai:
```powershell
npm run dev
```

### Option 2: Tanpa Concurrently (2 Terminal)

Buka 2 terminal di VS Code:

**Terminal 1 - Backend:**
```powershell
cd d:\Holicindo\unit-passport-portal
npm run dev:backend
```

**Terminal 2 - Frontend:**
```powershell
cd d:\Holicindo\unit-passport-portal
npm run dev:frontend
```

## Endpoints

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api-docs

## Jika Port Sudah Dipakai

```powershell
# Kill port 3001 (Backend)
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Kill port 3000 (Frontend)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Kill semua Node
taskkill /F /IM node.exe
```

## Memory Sudah Dioptimasi

✅ Memory limit: 4GB
✅ Webpack optimized  
✅ Source maps disabled

**Memory crash sudah diperbaiki.**

---

**Pilih Option 1 atau 2, terserah Anda yang mana lebih nyaman!**
