#!/bin/bash
# ==============================================
# Holicindo Backend - AWS EC2 Deploy Script
# Jalankan dari root project: ./deploy-to-ec2.sh <EC2_IP>
# ==============================================

EC2_IP=$1
KEY_FILE="./holicindo-server-key.pem"
REMOTE_USER="ubuntu"

if [ -z "$EC2_IP" ]; then
  echo "❌ Usage: ./deploy-to-ec2.sh <EC2_PUBLIC_IP>"
  exit 1
fi

echo "🚀 Deploying backend to EC2: $EC2_IP"

# 1. Build backend locally first
echo "📦 Building NestJS backend..."
cd app/backend
npm run build
cd ../..

# 2. Create archive of backend (exclude node_modules)
echo "📁 Packing backend files..."
tar -czf backend.tar.gz \
  --exclude='app/backend/node_modules' \
  --exclude='app/backend/.env' \
  app/backend

# 3. Upload to EC2
echo "⬆️  Uploading to EC2..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no backend.tar.gz "$REMOTE_USER@$EC2_IP:/home/ubuntu/"
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no app/backend/.env "$REMOTE_USER@$EC2_IP:/home/ubuntu/.env"

# 4. SSH and setup
echo "🔧 Setting up on EC2..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$REMOTE_USER@$EC2_IP" << 'ENDSSH'
  set -e

  # Install Node.js if not exists
  if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  # Install PM2 if not exists
  if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
  fi

  # Extract and setup backend
  echo "Extracting backend..."
  rm -rf /home/ubuntu/app
  tar -xzf /home/ubuntu/backend.tar.gz -C /home/ubuntu/
  cp /home/ubuntu/.env /home/ubuntu/app/backend/.env

  # Install dependencies
  echo "Installing npm packages..."
  cd /home/ubuntu/app/backend
  npm install --production

  # Restart or start PM2 process
  echo "Starting backend with PM2..."
  pm2 stop holicindo-api 2>/dev/null || true
  pm2 delete holicindo-api 2>/dev/null || true
  pm2 start npm --name "holicindo-api" -- run start:prod
  pm2 save

  # Enable PM2 autostart on reboot
  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

  echo "✅ Backend deployed and running!"
  pm2 status
ENDSSH

# Cleanup local archive
rm -f backend.tar.gz

echo ""
echo "✅ DEPLOY SELESAI!"
echo "Backend berjalan di: http://$EC2_IP:3001"
echo "Monitor log: ssh -i $KEY_FILE ubuntu@$EC2_IP 'pm2 logs holicindo-api'"
