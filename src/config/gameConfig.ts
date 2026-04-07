import { GameConfig } from '../types';

/**
 * ZERO HARDCODE: All game parameters are defined here
 * This is the single source of truth for all physical game properties
 * 
 * To scale the game, modify values here - UI will adapt automatically
 * To port to backend (Rust/Tauri), this config can be serialized/deserialized
 */

export const GAME_CONFIG: GameConfig = {
  board: {
    width: 600,
    height: 840,
    backgroundColor: '#F5F5DC', // Beige board
  },

  chips: {
    chaser: {
      radius: 30, // Волк больше - диаметр 60px
      color: '#FF4444', // Red
      count: 1,
    },
    runner: {
      radius: 20, // Зайцы меньше - диаметр 40px
      color: '#4444FF', // Blue
      count: 5,
    },
    phantom: {
      opacity: 0.5,
    },
  },

  scoringLines: {
    // Three horizontal lines for scoring
    y: [180, 360, 760],
    color: '#333333',
    strokeWidth: 2,
  },

  initialPositions: {
    chaser: [
      { x: 300, y: 100 }, // Top center of board
    ],
    runner: [
      { x: 100, y: 780 },
      { x: 200, y: 780 },
      { x: 300, y: 780 },
      { x: 400, y: 780 },
      { x: 500, y: 780 },
    ],
  },
};

/**
 * Derived constants (computed from config)
 * These are helper values to avoid recalculation
 */
export const DERIVED = {
  chaserDiameter: GAME_CONFIG.chips.chaser.radius * 2,
  runnerDiameter: GAME_CONFIG.chips.runner.radius * 2,
  boardCenter: {
    x: GAME_CONFIG.board.width / 2,
    y: GAME_CONFIG.board.height / 2,
  },
} as const;

/**
 * Game rules constants
 */
export const RULES = {
  // Points awarded for crossing scoring lines
  pointsPerLineCross: 1,
  
  // Maximum distance a chip can move (diameter of the chip)
  maxMoveDistanceMultiplier: 1, // Строго по размеру фишки (диаметр)
  
  // Capture occurs when distance <= sum of radii
  captureThreshold: 1, // multiplied by (chaserRadius + runnerRadius)
} as const;
