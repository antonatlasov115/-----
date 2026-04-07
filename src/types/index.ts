/**
 * Core type definitions for Sonor game
 * All game entities are strictly typed for type safety
 */

/**
 * 2D coordinate system
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Chip type discriminator
 */
export enum ChipType {
  CHASER = 'CHASER',
  RUNNER = 'RUNNER',
}

/**
 * Game mode
 */
export enum GameMode {
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  HOTSEAT = 'HOTSEAT',
  ONLINE_MULTIPLAYER = 'ONLINE_MULTIPLAYER',
}

/**
 * Game phase state machine
 */
export enum GamePhase {
  IDLE = 'IDLE',
  CHASER_TURN = 'CHASER_TURN',
  RUNNER_TURN = 'RUNNER_TURN',
  CHASER_SELECTING = 'CHASER_SELECTING',
  RUNNER_SELECTING = 'RUNNER_SELECTING',
  GAME_OVER = 'GAME_OVER',
}

/**
 * Individual chip entity
 */
export interface Chip {
  id: string;
  type: ChipType;
  position: Position;
  radius: number;
  isActive: boolean;
  isCaptured?: boolean;
  crossedLines: number[];
}

/**
 * Phantom chip for move preview
 */
export interface PhantomChip {
  id: string;
  type: ChipType;
  position: Position;
  radius: number;
  sourceChipId: string;
}

/**
 * Score tracking
 */
export interface Score {
  chaser: number;
  runner: number;
}

/**
 * Network connection status
 */
export type NetworkStatus = 'disconnected' | 'connecting' | 'connected';

/**
 * Complete game state
 */
export interface GameState {
  chips: Chip[];
  phantomChip: PhantomChip | null;
  selectedChipId: string | null;
  phase: GamePhase;
  score: Score;
  turn: number;
  mode: GameMode;
  playerRole: ChipType;
  movedChipsThisTurn: string[];
  roomId: string | null;
  playerId: string | null;
  networkStatus: NetworkStatus;
}

/**
 * Game configuration (all magic numbers)
 */
export interface GameConfig {
  board: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  chips: {
    chaser: {
      radius: number;
      color: string;
      count: number;
    };
    runner: {
      radius: number;
      color: string;
      count: number;
    };
    phantom: {
      opacity: number;
    };
  };
  scoringLines: {
    y: number[];
    color: string;
    strokeWidth: number;
  };
  initialPositions: {
    chaser: Position[];
    runner: Position[];
  };
}

/**
 * Move validation result
 */
export interface MoveValidation {
  isValid: boolean;
  reason?: string;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  hasCollision: boolean;
  capturedChipIds: string[];
}

/**
 * Line crossing detection result
 */
export interface LineCrossingResult {
  hasCrossed: boolean;
  lineIndex: number;
  points: number;
  newlyCrossedIndices: number[];
}

/**
 * AI move decision
 */
export interface AIMove {
  chipId: string;
  targetPosition: Position;
}

/**
 * Network move data
 */
export interface NetworkMoveData {
  chipId: string;
  targetPosition: Position;
  playerId: string;
  timestamp: number;
}
