#!/bin/bash
export PATH=$PATH:/home/ubuntu/.nvm/versions/node/v22.13.1/bin

cd /home/api

# Git 저장소 소유권 문제 해결
git config --global --add safe.directory /home/api

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "> Starting new process."
pm2 startup
pm2 start dist/src/main.js --name "api_back"
pm2 save

echo "Deployment completed successfully!"
echo "Performing health check..."
sleep 10

if curl -s http://localhost:3000 > /dev/null; then
    echo "Application is running successfully"
    exit 0
else
    echo "Failed to start application"
    exit 1
fi