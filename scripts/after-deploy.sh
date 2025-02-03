cd /home/api/api_back

echo "> Stopping current NestJS process."
pm2 stop api || true
pm2 delete api || true

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Starting application with PM2..."
pm2 start dist/main.js --name "app_back"

# 서버 재시작시 자동 시작
pm2 save

echo "Deployment completed successfully!"

echo "Performing health check..."
sleep 10  # 애플리케이션 시작 대기

if nc -z localhost 3000; then
    echo "Application is running successfully"
    exit 0
else
    echo "Failed to start application"
    exit 1
fi
