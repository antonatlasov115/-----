# Sonor - Intelligent Board Game

Enterprise-grade React implementation of the Sonor board game with **zero hardcode** architecture and **online multiplayer** support.

## ✨ Features

- 🎮 **Single Player** - Play against AI
- 👥 **Hotseat** - Local multiplayer
- 🌐 **Online Multiplayer** - Play with friends over the internet
- 🎨 **Visual Polish** - Smooth animations, gradients, shadows
- 🏗️ **Zero Hardcode** - Config-driven design
- 🧮 **Pure Engine** - Framework-agnostic game logic

## 🚀 Quick Start

### Local Game (Single Player / Hotseat)

```bash
npm install
npm run dev
```

### Online Multiplayer

**Option 1: Automatic (Windows)**
```bash
start-multiplayer.bat
```

**Option 2: Manual**
```bash
# Terminal 1 - Start server
cd server
npm install
npm start

# Terminal 2 - Start client
npm run dev
```

Then open `http://localhost:5173` and click **"Online Multiplayer"**

📖 **Detailed multiplayer setup**: See [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md)

## 🌐 Production Deployment

### Frontend (Vercel)
Frontend is automatically deployed from GitHub to Vercel.

### Backend (Render.com / Railway / Fly.io)
Multiplayer server needs to be deployed separately to a platform that supports WebSocket.

📖 **Deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

**Quick setup:**
1. Deploy server to Render.com (free tier)
2. Get server URL: `https://your-server.onrender.com`
3. Add environment variable in Vercel:
   - `VITE_SERVER_URL` = `https://your-server.onrender.com`
4. Redeploy frontend

## Architecture Principles

### 🎯 Config-Driven Design
All game parameters (board dimensions, chip sizes, colors, scoring rules) are centralized in `src/config/gameConfig.ts`. The entire UI adapts automatically to config changes.

### 🧮 Agnostic Game Engine
Pure mathematical functions in `src/engine/` handle all game logic:
- **Framework-independent**: No React/Zustand dependencies
- **Backend-ready**: Can be replaced with Rust/Tauri calls without touching UI
- **Pure functions**: Input → Calculation → Output

### 🔄 Clean Separation of Concerns
```
UI Components (Dumb) → Zustand Store (Thin Client) → Game Engine (Pure Logic)
```

## Project Structure

```
src/
├── types/              # TypeScript interfaces
│   └── index.ts        # GameState, Chip, Position, NetworkMoveData, etc.
├── config/             # Configuration (zero hardcode)
│   └── gameConfig.ts   # All magic numbers and parameters
├── engine/             # Pure game logic (framework-agnostic)
│   ├── math.ts         # Distance, collision, geometry
│   ├── collision.ts    # Capture detection
│   ├── validation.ts   # Move validation, scoring
│   ├── ai.ts           # AI algorithms
│   └── index.ts        # Public API
├── network/            # Online multiplayer
│   └── socket.ts       # NetworkManager (Socket.io client)
├── store/              # State management
│   └── useGameStore.ts # Zustand store (thin client)
├── components/         # React UI (dumb components)
│   ├── Chip.tsx        # 3D chip with gradients & shadows
│   ├── PhantomChip.tsx # Pulsing preview chip
│   ├── ScoringLines.tsx
│   ├── GameBoard/      # Gradient background
│   ├── GameControls/   # Game mode selection
│   └── OnlineLobby/    # Multiplayer lobby
├── App.tsx             # Root component
└── main.tsx            # Entry point

server/                 # Socket.io multiplayer server
├── index.js            # Server implementation
├── package.json
└── README.md
```

## Game Rules

- **Chaser** (red, 1 chip): Captures runners
- **Runners** (blue, 5 chips): Avoid capture, score points
- **Movement**: Click chip → move phantom → click to confirm (right-click to cancel)
- **Max distance**: Chip diameter
- **Capture**: When chaser overlaps runner
- **Scoring**: Cross horizontal lines for points

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Type Check

```bash
npm run type-check
```

## Extending the Game

### Change Board Size
Edit `src/config/gameConfig.ts`:
```typescript
board: {
  width: 1200,  // Change here
  height: 800,  // Change here
}
```

### Add More Chips
```typescript
chips: {
  runner: {
    count: 10,  // Increase count
  }
}
```

### Modify Scoring Lines
```typescript
scoringLines: {
  y: [100, 200, 300, 400, 500],  // Add more lines
}
```

### Replace Engine with Backend
The `src/engine/` module can be swapped with API calls to a Rust/Tauri backend:

```typescript
// Before (pure functions)
import { validateMove } from '../engine';

// After (backend calls)
const validateMove = async (chip, target) => {
  return await fetch('/api/validate-move', { ... });
};
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **React-Konva** - Canvas rendering with animations
- **Socket.io** - Real-time multiplayer
- **Vite** - Build tool
- **Node.js + Express** - Multiplayer server

## Visual Features

- 🎨 **Radial Gradients** - 3D wooden chip effect
- 🌑 **Dynamic Shadows** - Depth and elevation
- ✨ **Smooth Animations** - 300ms easing transitions
- 💫 **Pulsing Effects** - Phantom chip attention grabber
- 🌈 **Gradient Background** - Textured game board

## License

MIT
