#!/bin/bash
export PATH=$PATH:/home/ubuntu/.nvm/versions/node/v22.13.1/bin

cd /home/api/api_back

echo "> Stopping current NestJS process."
if pm2 list | grep -q "api_back"; then
    pm2 delete api_back
fi

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Starting application with PM2..."
pm2 start dist/src/main.js --name "api_back" --log /home/api/api_back/pm2.log
pm2 save

echo "Waiting for application to start..."
sleep 30

echo "Checking application status..."
# 포트 리스닝 상태 확인
sudo netstat -tuln | grep :3000

# 상세 연결 시도
curl -v http://localhost:3000 > /tmp/curl_output.log 2>&1

echo "Curl output:"
cat /tmp/curl_output.log

# 포트에 리스닝하는 프로세스 확인
sudo lsof -i :3000

if [ $? -eq 0 ]; then
    echo "Application is running successfully"
    exit 0
else
    echo "Failed to start application"
    echo "PM2 Logs:"
    cat /home/api/api_back/pm2.log
    exit 1
fi