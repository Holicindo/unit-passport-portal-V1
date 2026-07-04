# Script untuk quick check dev server status
# Run: .\\.kiro\check-dev-status.ps1

Write-Host "=== DEV SERVER STATUS CHECK ===" -ForegroundColor Cyan
Write-Host ""

# Check ports
Write-Host "Backend (Port 3001):" -NoNewline
$backend = netstat -ano | findstr :3001
if ($backend) {
    Write-Host " RUNNING ✓" -ForegroundColor Green
} else {
    Write-Host " NOT RUNNING ✗" -ForegroundColor Red
}

Write-Host "Frontend (Port 3000):" -NoNewline
$frontend = netstat -ano | findstr :3000
if ($frontend) {
    Write-Host " RUNNING ✓" -ForegroundColor Green
} else {
    Write-Host " NOT RUNNING ✗" -ForegroundColor Red
}

Write-Host ""
Write-Host "To start dev server: npm run dev" -ForegroundColor Yellow
Write-Host "To kill hanging process: taskkill /F /PID <PID>" -ForegroundColor Yellow
