import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Store active rooms and players
const rooms = new Map();

// Helper to get room info
function getRoomInfo(roomId, gameMode = 'CLASSIC') {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      players: [],
      gameState: null,
      gameMode: gameMode, // 'CLASSIC' or 'COOP'
    });
  }
  return rooms.get(roomId);
}

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  // Join room
  socket.on('join-room', ({ roomId, playerId, playerName }) => {
    console.log(`[${new Date().toISOString()}] Player ${playerId} (${playerName}) joining room ${roomId}`);

    // Leave any previous rooms
    Array.from(socket.rooms).forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join new room
    socket.join(roomId);

    // Store player info
    const room = getRoomInfo(roomId);
    const existingPlayer = room.players.find((p) => p.playerId === playerId);

    let playerRole = null;
    let isReconnecting = false;

    if (!existingPlayer) {
      // New player joining
      // Assign role randomly for first player, opposite for second
      if (room.players.length === 0) {
        // First player gets random role
        playerRole = Math.random() < 0.5 ? 'CHASER' : 'RUNNER';
      } else if (room.players.length === 1) {
        // Second player gets opposite role
        const firstPlayerRole = room.players[0].role;
        playerRole = firstPlayerRole === 'CHASER' ? 'RUNNER' : 'CHASER';
      } else {
        // Room is full
        socket.emit('error', 'Room is full (max 2 players)');
        return;
      }

      room.players.push({
        playerId,
        playerName: playerName || 'Игрок',
        socketId: socket.id,
        role: playerRole,
        connectedAt: new Date().toISOString(),
      });

      console.log(`[${new Date().toISOString()}] New player ${playerId} (${playerName}) assigned role: ${playerRole}`);
    } else {
      // Reconnecting player
      isReconnecting = true;
      existingPlayer.socketId = socket.id;
      existingPlayer.playerName = playerName || existingPlayer.playerName;
      playerRole = existingPlayer.role;

      console.log(`[${new Date().toISOString()}] Player ${playerId} (${playerName}) reconnected with role: ${playerRole}`);
    }

    // Get opponent info
    const opponent = room.players.find((p) => p.playerId !== playerId);

    // Notify player they joined successfully with their role and opponent info
    socket.emit('room-joined', {
      roomId,
      playerId,
      role: playerRole,
      opponentName: opponent ? opponent.playerName : null,
      isReconnecting,
    });

    // Notify other players in room about new player (only if not reconnecting)
    if (!isReconnecting) {
      socket.to(roomId).emit('player-joined', {
        playerId,
        playerName: playerName || 'Игрок',
        role: playerRole,
      });
    } else {
      // Notify opponent about reconnection
      socket.to(roomId).emit('player-reconnected', {
        playerId,
        playerName: playerName || 'Игрок',
      });
    }

    console.log(`[${new Date().toISOString()}] Room ${roomId} now has ${room.players.length} player(s)`);
  });

  // Player makes a move
  socket.on('player-move', ({ roomId, moveData }) => {
    console.log(`[${new Date().toISOString()}] Move in room ${roomId}:`, {
      chipId: moveData.chipId,
      playerId: moveData.playerId,
      position: moveData.targetPosition,
    });

    // Broadcast move to all other players in the room
    socket.to(roomId).emit('opponent-move', moveData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);

    // Find and remove player from rooms
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        console.log(`[${new Date().toISOString()}] Player ${player.playerId} left room ${roomId}`);
        
        // Notify other players
        socket.to(roomId).emit('player-left', { playerId: player.playerId });
        
        // Remove player
        room.players.splice(playerIndex, 1);

        // Clean up empty rooms
        if (room.players.length === 0) {
          console.log(`[${new Date().toISOString()}] Room ${roomId} is empty, removing...`);
          rooms.delete(roomId);
        }
      }
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Socket error:`, error);
    socket.emit('error', error.message);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    totalPlayers: Array.from(rooms.values()).reduce((sum, room) => sum + room.players.length, 0),
  });
});

// Rooms info endpoint
app.get('/rooms', (req, res) => {
  const roomsInfo = Array.from(rooms.entries()).map(([roomId, room]) => ({
    roomId,
    playerCount: room.players.length,
    players: room.players.map((p) => ({
      playerId: p.playerId,
      connectedAt: p.connectedAt,
    })),
  }));
  res.json(roomsInfo);
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎮  Sonor Multiplayer Server                           ║
║                                                           ║
║   Server running on: http://0.0.0.0:${PORT}                ║
║   Health check:      http://0.0.0.0:${PORT}/health        ║
║   Rooms info:        http://0.0.0.0:${PORT}/rooms         ║
║                                                           ║
║   Ready for connections! 🚀                               ║
║                                                           ║
╔═══════════════════════════════════════════════════════════╗
  `);
});
