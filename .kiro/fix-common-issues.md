# 🔧 Common Issues & Quick Fixes

## 1. Turbopack Cache Corruption (Error: cache file not found)
**Symptoms:** `Failed to open SST file`, `corrupted database`

```bash
# Fix: Delete cache and restart
Remove-Item -Recurse -Force "app\frontend\.next"
npm run dev
```

## 2. Port Already in Use (EADDRINUSE)
**Symptoms:** `Port 3000 is already in use`, `Port 3001 is already in use`

```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process (replace <PID> with actual PID from above)
taskkill /F /PID <PID>

# Restart
npm run dev
```

## 3. CSS Not Updating / Stuck Old Design
**Symptoms:** Browser shows old styles despite saving changes

```bash
# Hard refresh browser
Ctrl + Shift + R  (Chrome/Edge)
Ctrl + F5         (Firefox)

# If still stuck, clear Next.js cache
Remove-Item -Recurse -Force "app\frontend\.next"
npm run dev
```

## 4. NestJS Not Starting / Hanging on Compile
**Symptoms:** Backend stuck at "Starting compilation..."

```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Clean backend dist
Remove-Item -Recurse -Force "app\backend\dist"

# Restart
npm run dev
```

## 5. TypeScript Errors After Git Pull
**Symptoms:** Red squiggles everywhere, `Cannot find module`

```bash
# Reinstall dependencies
npm install --prefix app/frontend
npm install --prefix app/backend

# Restart VS Code
Ctrl + Shift + P -> "Reload Window"
```

## 6. Database Connection Error
**Symptoms:** `ECONNREFUSED`, `Connection timeout`

```bash
# Check .env file exists
cat app\backend\.env

# Check PostgreSQL is running
# Make sure DB credentials are correct
```

## 7. Hot Reload Not Working
**Symptoms:** Changes don't appear, need manual refresh

```bash
# This is usually Turbopack issue, force rebuild:
Remove-Item -Recurse -Force "app\frontend\.next"
npm run dev
```

## Daily Workflow Best Practices

### Starting Work
```bash
# Always use root command to start both servers
npm run dev
```

### Making CSS Changes
1. Edit CSS file
2. Save (Ctrl+S)
3. Wait 2-3 seconds
4. Check browser (should auto-refresh)
5. If no update, hard refresh (Ctrl+Shift+R)

### Before Committing Code
```bash
# Make sure everything compiles
npm run build --prefix app/frontend
npm run build --prefix app/backend
```

### End of Day
```bash
# Stop dev server gracefully
Ctrl + C in terminal

# If stuck, force kill
taskkill /F /IM node.exe
```

## Emergency: Kill Everything
```bash
# Nuclear option - kills all Node processes
taskkill /F /IM node.exe

# Then restart fresh
npm run dev
```
