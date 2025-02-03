#!/bin/bash
export PATH=$PATH:/home/ubuntu/.nvm/versions/node/v22.13.1/bin

cd /home/api/api_back

# Git 저장소 소유권 문제 해결
git config --global --add safe.directory /home/api/api_back

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "> Checking if NestJS process is running..."
if ! pm2 list | grep -q "api_back"; then
    echo "> Reloading existing process."
    pm2 reload api_back
else
    echo "> Starting new process."
    pm2 start dist/src/main.js --name "api_back"
fi

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