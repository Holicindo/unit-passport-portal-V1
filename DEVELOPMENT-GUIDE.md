# 🚀 Development Guide - Holicindo Unit Passport Portal

## Masalah Memory yang Sudah Diperbaiki

### ❌ Masalah Sebelumnya
- Next.js development menggunakan terlalu banyak memory
- Error: `FATAL ERROR: AlignedAlloc Allocation failed - process out of memory`
- Frontend crash berkala saat development

### ✅ Solusi yang Sudah Diimplementasi
1. **Memory Limit** ditingkatkan ke 4GB (`--max-old-space-size=4096`)
2. **Webpack Optimization** untuk mengurangi memory usage
3. **Source Maps Disabled** di development mode
4. **File Watching** dioptimasi dengan debounce
5. **Telemetry Disabled** untuk mengurangi overhead

## 📝 Cara Menjalankan Development

### Option 1: Master Script (Recommended) ⭐
Jalankan backend dan frontend sekaligus dengan satu command:

```powershell
# Di root project (d:\Holicindo\unit-passport-portal)
.\start-dev.ps1
```

**Akan membuka 2 PowerShell windows:**
- Window 1: Backend (Port 3001)
- Window 2: Frontend (Port 3000)

**Automatic cleanup:**
- Auto-kill process yang menggunakan port 3000 dan 3001
- Memory limit sudah di-set otomatis

### Option 2: Manual - Separate Terminals

#### Terminal 1 - Backend
```powershell
cd d:\Holicindo\unit-passport-portal\app\backend
.\dev.ps1
```

#### Terminal 2 - Frontend
```powershell
cd d:\Holicindo\unit-passport-portal\app\frontend
.\dev.ps1
```

### Option 3: Direct npm commands (Old Way)

#### Terminal 1 - Backend
```powershell
cd d:\Holicindo\unit-passport-portal\app\backend
npm run start:dev
```

#### Terminal 2 - Frontend
```powershell
cd d:\Holicindo\unit-passport-portal\app\frontend
npm run dev
```

## 🔧 Optimasi yang Diterapkan

### 1. package.json (Frontend)
```json
{
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=\"--max-old-space-size=4096\" TURBOPACK=0 next dev"
  }
}
```

### 2. .env.local (Frontend)
```env
NODE_OPTIONS=--max-old-space-size=4096
NEXT_TELEMETRY_DISABLED=1
```

### 3. next.config.ts
- Webpack parallelism = 1 (kurangi thread)
- Source maps disabled di development
- File watching dengan debounce 600ms
- Polling disabled (save memory)
- Split chunks optimized

## 🐛 Troubleshooting

### Problem: "Port already in use"
**Solution:**
```powershell
# Kill process on port 3001 (Backend)
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Kill process on port 3000 (Frontend)
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Problem: "Out of Memory" masih terjadi
**Solution 1 - Increase memory lebih banyak:**
Edit `.env.local`:
```env
NODE_OPTIONS=--max-old-space-size=8192
```

**Solution 2 - Gunakan Production Build:**
```powershell
cd app\frontend
npm run build
npm run start
```
Production build jauh lebih ringan dan stabil.

### Problem: Frontend lambat reload
**Solution:**
Restart frontend setiap 2-3 jam karena memory leak di Next.js development mode.

### Problem: Webpack compilation error
**Solution:**
```powershell
# Clear Next.js cache
cd app\frontend
Remove-Item -Recurse -Force .next
npm run dev
```

## 📊 Resource Usage (Expected)

### Before Optimization
- Memory: 1.5GB - 2.5GB
- CPU: 60-80%
- Crashes: Frequent

### After Optimization
- Memory: 800MB - 1.5GB
- CPU: 40-60%
- Crashes: Rare (hanya jika build sangat besar)

## 🎯 Best Practices

### 1. Regular Restart
Restart frontend setiap beberapa jam untuk clear memory:
```powershell
# Tekan Ctrl+C di terminal frontend, lalu:
npm run dev
```

### 2. Use Production for Testing
Untuk testing yang lebih stabil, gunakan production build:
```powershell
npm run build
npm run start
```

### 3. Monitor Memory
Buka Task Manager dan monitor `Node.js` process:
- Backend: biasanya ~300-500MB
- Frontend dev: biasanya ~800-1200MB
- Jika > 2GB, restart

### 4. Incremental Development
Jangan edit terlalu banyak file sekaligus di development mode. Edit satu komponen, test, baru lanjut.

## 🔗 Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js App |
| Backend | http://localhost:3001 | NestJS API |
| Swagger | http://localhost:3001/api-docs | API Documentation |

## 📦 Scripts Reference

| Script | Location | Purpose |
|--------|----------|---------|
| `start-dev.ps1` | Root | Start both backend & frontend |
| `app/backend/dev.ps1` | Backend | Start backend only |
| `app/frontend/dev.ps1` | Frontend | Start frontend only |

## 💡 Tips

1. **Gunakan `start-dev.ps1`** untuk development harian
2. **Close browser tabs** yang tidak digunakan untuk save memory
3. **Use Chrome DevTools** dengan throttling disabled
4. **Restart setiap 2-3 jam** jika frontend terasa lambat
5. **Production build** untuk demo/testing yang penting

## 🆘 Emergency: Kill All Node Processes

Jika semua crash dan tidak bisa start:
```powershell
# WARNING: Ini akan kill SEMUA node.exe processes!
taskkill /F /IM node.exe

# Lalu start ulang
.\start-dev.ps1
```

## 📝 Notes

- Memory optimization sudah agresif, seharusnya tidak crash lagi
- Jika masih crash, cek RAM komputer (minimum 8GB recommended)
- Development mode memang memory-intensive, production jauh lebih ringan
- Backend NestJS sangat ringan (~300MB), masalahnya biasanya di Frontend Next.js
