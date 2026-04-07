# Deployment Guide

## Frontend (Vercel)

Frontend уже задеплоен на Vercel автоматически из GitHub.

## Backend (Render.com)

### Шаг 1: Создайте аккаунт на Render.com

1. Перейдите на https://render.com
2. Зарегистрируйтесь через GitHub

### Шаг 2: Создайте новый Web Service

1. Нажмите "New +" → "Web Service"
2. Подключите ваш GitHub репозиторий
3. Настройте сервис:
   - **Name**: `sonor-server`
   - **Region**: Oregon (US West) или ближайший к вам
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Добавьте переменную окружения:
   - Key: `PORT`
   - Value: `3001`

5. Нажмите "Create Web Service"

### Шаг 3: Получите URL сервера

После деплоя вы получите URL вида: `https://sonor-server.onrender.com`

### Шаг 4: Обновите клиент

Добавьте переменную окружения в Vercel:

1. Перейдите в настройки проекта на Vercel
2. Settings → Environment Variables
3. Добавьте:
   - Key: `VITE_SERVER_URL`
   - Value: `https://sonor-server.onrender.com` (ваш URL с Render)
4. Redeploy проект

## Альтернативные платформы для сервера

### Railway.app
- Бесплатный tier: $5 кредитов в месяц
- Поддержка WebSocket
- Простой деплой из GitHub

### Fly.io
- Бесплатный tier: 3 VM
- Отличная производительность
- Поддержка WebSocket

### Heroku
- Платный (от $5/месяц после отмены бесплатного tier)
- Надежный и проверенный

## Проверка работы

После деплоя проверьте:

1. Health check: `https://your-server.onrender.com/health`
2. Rooms info: `https://your-server.onrender.com/rooms`
3. Откройте игру и попробуйте создать комнату

## Troubleshooting

### Сервер не отвечает
- Проверьте логи на Render.com
- Убедитесь, что PORT установлен в переменных окружения
- Проверьте, что сервер слушает на `0.0.0.0`, а не `localhost`

### WebSocket не подключается
- Убедитесь, что используете `wss://` для HTTPS сайтов
- Проверьте CORS настройки на сервере
- Проверьте, что клиент использует правильный URL сервера

### Free tier Render засыпает
- Бесплатный tier Render засыпает после 15 минут неактивности
- Первое подключение может занять 30-60 секунд (cold start)
- Рассмотрите платный план ($7/месяц) для постоянной работы
