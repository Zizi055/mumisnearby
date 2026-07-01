#!/bin/bash
# Деплой bonus-сервера на Beget
# Запускать: bash deploy.sh

set -e

SERVER_USER="ваш_логин_beget"
SERVER_HOST="rodnyegolosa.ru"
SERVER_PATH="/home/$SERVER_USER/rodnyegolosa.ru/bonus-api"

echo "▶ Проверяем сервер локально..."
node index.js &
PID=$!
sleep 1

STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/health)
kill $PID 2>/dev/null

if [ "$STATUS" != "200" ]; then
  echo "✗ Локальная проверка не прошла (HTTP $STATUS) — деплой отменён"
  exit 1
fi

echo "✓ Сервер проверен (HTTP 200)"
echo ""
echo "▶ Отправляем на $SERVER_HOST..."

rsync -avz --exclude='node_modules' \
  ./ "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

echo "▶ Устанавливаем зависимости и перезапускаем..."
ssh "$SERVER_USER@$SERVER_HOST" "
  cd $SERVER_PATH
  npm install --production
  pm2 restart bonus-api || pm2 start index.js --name bonus-api --env production
  pm2 save
"

echo ""
echo "✅ Деплой завершён → https://rodnyegolosa.ru/api/subscription/bonus"
