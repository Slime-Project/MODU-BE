#!/bin/bash
export PATH=$PATH:/home/ubuntu/.nvm/versions/node/v22.13.1/bin

cd /home/api/api_back

# Git 저장소 소유권 문제 해결
git config --global --add safe.directory /home/api/api_back

echo "> Stopping current NestJS process."
if pm2 list | grep -q "api_back"; then
    pm2 delete api_back
fi

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Starting application with PM2..."
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