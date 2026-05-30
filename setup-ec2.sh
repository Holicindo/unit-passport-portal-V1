#!/bin/bash
set -e
echo "Updating apt..."
sudo apt-get update -y > /dev/null
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null
sudo apt-get install -y nodejs > /dev/null
echo "Extracting backend..."
tar -xf backend.tar
cd app/backend
echo "Installing npm dependencies..."
npm install
echo "Building backend..."
npm run build
echo "Installing pm2..."
sudo npm install -g pm2 > /dev/null
echo "Starting backend..."
pm2 start npm --name "holicindo-api" -- run start:prod
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
echo "Backend is now running!"
