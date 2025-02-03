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
pm2 start dist/main.js --name "api_back"
pm2 save

echo "Deployment completed successfully!"
echo "Performing health check..."
sleep 10

# netcat 대신 curl 사용 (curl은 보통 기본 설치되어 있음)
if curl -s http://localhost:3000 > /dev/null; then
    echo "Application is running successfully"
    exit 0
else
    echo "Failed to start application"
    exit 1
fi