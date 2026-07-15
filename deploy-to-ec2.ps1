# Deploy Backend Holicindo ke AWS EC2 (Windows PowerShell)
# ============================================================
# Jalankan dari root project:
# .\deploy-to-ec2.ps1 -EC2IP "13.xxx.xxx.xxx"
# ============================================================

param(
  [Parameter(Mandatory=$true)]
  [string]$EC2IP
)

$KEY_FILE = ".\holicindo-server-key.pem"
$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "$REMOTE_USER@$EC2IP"

Write-Host "🚀 Deploying Holicindo Backend ke EC2: $EC2IP" -ForegroundColor Cyan

# Step 1: Build backend locally
Write-Host "`n📦 Step 1: Building NestJS backend..." -ForegroundColor Yellow
Set-Location app\backend
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Build gagal!" -ForegroundColor Red; exit 1 }
Set-Location ..\..
Write-Host "✅ Build berhasil!" -ForegroundColor Green

# Step 2: Fix key file permissions
Write-Host "`n🔑 Step 2: Set permissions untuk .pem file..." -ForegroundColor Yellow
icacls $KEY_FILE /inheritance:r /grant:r "$env:USERNAME:(R)"
Write-Host "✅ Permission set!" -ForegroundColor Green

# Step 3: Upload backend files
Write-Host "`n⬆️  Step 3: Upload ke EC2..." -ForegroundColor Yellow

# Upload dist folder and package files
scp -i $KEY_FILE -o "StrictHostKeyChecking=no" -r app\backend\dist "$REMOTE_HOST:/tmp/dist"
scp -i $KEY_FILE -o "StrictHostKeyChecking=no" app\backend\package.json "$REMOTE_HOST:/tmp/package.json"
scp -i $KEY_FILE -o "StrictHostKeyChecking=no" app\backend\package-lock.json "$REMOTE_HOST:/tmp/package-lock.json"
scp -i $KEY_FILE -o "StrictHostKeyChecking=no" app\backend\.env "$REMOTE_HOST:/tmp/.env"

if ($LASTEXITCODE -ne 0) { Write-Host "❌ Upload gagal! Cek IP EC2 dan Security Group." -ForegroundColor Red; exit 1 }
Write-Host "✅ Upload berhasil!" -ForegroundColor Green

# Step 4: Setup dan jalankan di EC2
Write-Host "`n🔧 Step 4: Setup di EC2 server..." -ForegroundColor Yellow

$SETUP_COMMANDS = @"
  # Install Node.js jika belum ada
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  # Install PM2 jika belum ada
  if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
  fi

  # Setup folder backend
  mkdir -p /home/ubuntu/holicindo-backend
  cp -r /tmp/dist /home/ubuntu/holicindo-backend/
  cp /tmp/package.json /home/ubuntu/holicindo-backend/
  cp /tmp/package-lock.json /home/ubuntu/holicindo-backend/
  cp /tmp/.env /home/ubuntu/holicindo-backend/

  # Install dependencies (production only)
  cd /home/ubuntu/holicindo-backend
  npm install --omit=dev

  # Stop dan hapus proses lama jika ada
  pm2 stop holicindo-api 2>/dev/null || true
  pm2 delete holicindo-api 2>/dev/null || true

  # Jalankan dengan PM2
  pm2 start dist/main.js --name "holicindo-api"
  pm2 save

  # Setup autostart
  sudo env PATH=${'$'}PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

  echo "DONE"
  pm2 status
"@

ssh -i $KEY_FILE -o "StrictHostKeyChecking=no" $REMOTE_HOST $SETUP_COMMANDS

Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅  DEPLOY SELESAI!" -ForegroundColor Green  
Write-Host "============================================" -ForegroundColor Green
Write-Host "Backend URL: http://$EC2IP`:3001" -ForegroundColor Cyan
Write-Host "Swagger    : http://$EC2IP`:3001/api-docs" -ForegroundColor Cyan
Write-Host "`nLihat log  : ssh -i $KEY_FILE ubuntu@$EC2IP 'pm2 logs holicindo-api --lines 50'" -ForegroundColor Gray
Write-Host "`n⚠️  JANGAN LUPA: Update NEXT_PUBLIC_API_URL di frontend ke http://$EC2IP`:3001" -ForegroundColor Yellow
