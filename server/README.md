# Sonor Multiplayer Server

Socket.io сервер для онлайн-мультиплеера игры Сонор.

## Установка

```bash
cd server
npm install
```

## Запуск

### Режим разработки (с автоперезагрузкой)
```bash
npm run dev
```

### Продакшн режим
```bash
npm start
```

Сервер запустится на порту **3001** (или PORT из переменных окружения).

## API Endpoints

### Health Check
```
GET http://localhost:3001/health
```

Возвращает статус сервера и количество активных комнат/игроков.

### Rooms Info
```
GET http://localhost:3001/rooms
```

Возвращает информацию о всех активных комнатах и игроках.

## Socket.io Events

### Client → Server

#### `join-room`
Присоединиться к игровой комнате.
```javascript
socket.emit('join-room', { 
  roomId: 'room-123', 
  playerId: 'player-456' 
});
```

#### `player-move`
Отправить ход оппоненту.
```javascript
socket.emit('player-move', { 
  roomId: 'room-123',
  moveData: {
    chipId: 'runner-0',
    targetPosition: { x: 300, y: 400 },
    playerId: 'player-456',
    timestamp: Date.now()
  }
});
```

### Server → Client

#### `room-joined`
Подтверждение успешного присоединения к комнате.
```javascript
socket.on('room-joined', ({ roomId, playerId }) => {
  console.log('Joined room:', roomId);
});
```

#### `opponent-move`
Получен ход от оппонента.
```javascript
socket.on('opponent-move', (moveData) => {
  console.log('Opponent moved:', moveData);
});
```

#### `player-joined`
Другой игрок присоединился к комнате.
```javascript
socket.on('player-joined', ({ playerId }) => {
  console.log('Player joined:', playerId);
});
```

#### `player-left`
Игрок покинул комнату.
```javascript
socket.on('player-left', ({ playerId }) => {
  console.log('Player left:', playerId);
});
```

#### `error`
Произошла ошибка.
```javascript
socket.on('error', (error) => {
  console.error('Error:', error);
});
```

## Архитектура

Сервер использует простую архитектуру с хранением комнат в памяти:

- **Rooms Map**: Хранит информацию о всех активных комнатах
- **Room Structure**: 
  - `players[]`: Массив игроков в комнате
  - `gameState`: Состояние игры (опционально)

### Особенности

- Автоматическая очистка пустых комнат
- Поддержка переподключения игроков
- Логирование всех событий с временными метками
- CORS настроен для работы с любым origin

## Интеграция с клиентом

Клиент (React приложение) подключается к серверу через NetworkManager:

```typescript
import { networkManager } from './network/socket';

// Подключение к комнате
networkManager.connect('room-123', 'player-456', 'http://localhost:3001');

// Отправка хода
networkManager.sendMove('runner-0', { x: 300, y: 400 });

// Получение ходов
networkManager.onMoveReceived((moveData) => {
  console.log('Received move:', moveData);
});
```

## Масштабирование

Для продакшн использования рекомендуется:

1. **Redis Adapter** для синхронизации между несколькими серверами
2. **Персистентное хранилище** для сохранения состояния игр
3. **Rate limiting** для защиты от спама
4. **Authentication** для идентификации игроков
5. **Мониторинг** (например, через Prometheus)

## Troubleshooting

### Порт уже занят
Измените порт через переменную окружения:
```bash
PORT=3002 npm start
```

### Клиент не может подключиться
Проверьте:
1. Сервер запущен и доступен
2. URL в клиенте правильный (`http://localhost:3001`)
3. CORS настроен корректно
4. Firewall не блокирует соединение

### Логи
Все события логируются в консоль с временными метками для отладки.
