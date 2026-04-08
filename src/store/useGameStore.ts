import { create } from 'zustand';
import { GameState, GamePhase, Chip, ChipType, Position, PhantomChip, GameMode, AIMove, NetworkMoveData } from '../types';
import { GAME_CONFIG, RULES } from '../config/gameConfig';
import {
  validateMove,
  validateChipSelection,
  detectCaptures,
  checkLineCrossings,
  calculateCrossingPoints,
  getNewlyCrossedIndices,
  isGameOver,
  calculateChaserMove,
  calculateRunnersMoves,
  countActiveRunners,
} from '../engine';
import { networkManager } from '../network/socket';
import { t } from '../utils/i18n';
import { soundManager } from '../utils/sounds';
import { sessionManager } from '../utils/sessionManager';

/**
 * ZUSTAND STORE - Thin Client Layer
 * 
 * Store manages state and delegates all logic to the engine
 * No business logic here - only state updates and engine calls
 * 
 * Architecture: UI → Store → Engine → Store → UI
 * Network: UI → Store → NetworkManager → Socket.io Server
 */

interface ScoreAnimationData {
  points: number;
  color: string;
}

interface GameStore extends GameState {
  // Score animation state
  scoreAnimation: ScoreAnimationData | null;
  clearScoreAnimation: () => void;

  // Player name
  playerName: string | null;
  setPlayerName: (name: string) => void;
  opponentName: string | null;

  // Sound control
  soundEnabled: boolean;
  toggleSound: () => void;

  // Actions
  initializeGame: () => void;
  selectChip: (chipId: string) => void;
  movePhantomChip: (position: Position) => void;
  confirmMove: () => void;
  cancelMove: () => void;
  resetGame: () => void;
  executeAITurn: () => void;
  setGameMode: (mode: GameMode) => void;
  setPlayerRole: (role: ChipType) => void;
  connectToRoom: (roomId: string, playerId: string) => void;
  disconnectFromRoom: () => void;
  receiveNetworkMove: (moveData: NetworkMoveData) => void;
}

/**
 * Initialize chips from config
 */
function createInitialChips(): Chip[] {
  const chips: Chip[] = [];

  // Create chaser chips
  GAME_CONFIG.initialPositions.chaser.forEach((position, index) => {
    chips.push({
      id: `chaser-${index}`,
      type: ChipType.CHASER,
      position,
      radius: GAME_CONFIG.chips.chaser.radius,
      isActive: true,
      isCaptured: false,
      crossedLines: [],
    });
  });

  // Create runner chips
  GAME_CONFIG.initialPositions.runner.forEach((position, index) => {
    chips.push({
      id: `runner-${index}`,
      type: ChipType.RUNNER,
      position,
      radius: GAME_CONFIG.chips.runner.radius,
      isActive: true,
      isCaptured: false,
      crossedLines: [],
    });
  });

  return chips;
}

/**
 * Initial game state
 */
const initialState: GameState = {
  chips: createInitialChips(),
  phantomChip: null,
  selectedChipId: null,
  phase: GamePhase.CHASER_TURN,
  score: {
    chaser: 0,
    runner: 0,
  },
  turn: 1,
  mode: GameMode.SINGLE_PLAYER,
  playerRole: ChipType.RUNNER,
  movedChipsThisTurn: [],
  roomId: null,
  playerId: null,
  networkStatus: 'disconnected',
};

const initialStoreState = {
  ...initialState,
  scoreAnimation: null as ScoreAnimationData | null,
  playerName: null as string | null,
  opponentName: null as string | null,
  soundEnabled: soundManager.isEnabled(),
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialStoreState,

  /**
   * Clear score animation
   */
  clearScoreAnimation: () => {
    set({ scoreAnimation: null });
  },

  /**
   * Set player name
   */
  setPlayerName: (name: string) => {
    set({ playerName: name });
  },

  /**
   * Toggle sound on/off
   */
  toggleSound: () => {
    const newState = !soundManager.isEnabled();
    soundManager.setEnabled(newState);
    set({ soundEnabled: newState });
  },

  /**
   * Initialize/reset game to starting state
   */
  initializeGame: () => {
    set({
      ...initialState,
      chips: createInitialChips(),
      scoreAnimation: null,
    });
  },

  /**
   * Select a chip to move
   */
  selectChip: (chipId: string) => {
    const state = get();
    const chip = state.chips.find((c) => c.id === chipId);

    if (!chip) return;

    // In single player mode, only allow selecting player's chips
    if (state.mode === GameMode.SINGLE_PLAYER && chip.type !== state.playerRole) {
      console.warn(t('errors.cannotSelectAI'));
      return;
    }

    // In online multiplayer mode, only allow selecting your own chips
    if (state.mode === GameMode.ONLINE_MULTIPLAYER && chip.type !== state.playerRole) {
      console.warn(t('errors.cannotSelectOpponent'));
      return;
    }

    // Validate chip selection using engine
    const validation = validateChipSelection(chip);
    if (!validation.isValid) {
      console.warn(t('errors.invalidSelection'), validation.reason);
      return;
    }

    // Check if chip type matches current turn
    const isValidTurn =
      (state.phase === GamePhase.CHASER_TURN && chip.type === ChipType.CHASER) ||
      (state.phase === GamePhase.RUNNER_TURN && chip.type === ChipType.RUNNER);

    if (!isValidTurn) {
      console.warn(t('errors.notYourTurn'));
      return;
    }

    // For runners, check if this chip has already moved this turn
    if (chip.type === ChipType.RUNNER && state.movedChipsThisTurn.includes(chipId)) {
      console.warn(t('errors.alreadyMoved'));
      return;
    }

    // Create phantom chip at same position
    const phantomChip: PhantomChip = {
      id: `phantom-${chipId}`,
      type: chip.type,
      position: { ...chip.position },
      radius: chip.radius,
      sourceChipId: chipId,
    };

    set({
      selectedChipId: chipId,
      phantomChip,
      phase: chip.type === ChipType.CHASER 
        ? GamePhase.CHASER_SELECTING 
        : GamePhase.RUNNER_SELECTING,
    });
  },

  /**
   * Move phantom chip (preview move)
   * Phantom moves on exact orbit at distance = chip diameter
   * Prevents sudden 180° flips by limiting angular velocity
   */
  movePhantomChip: (position: Position) => {
    const state = get();
    
    if (!state.phantomChip || !state.selectedChipId) return;

    const selectedChip = state.chips.find((c) => c.id === state.selectedChipId);
    if (!selectedChip) return;

    // Calculate exact move distance (chip diameter)
    const exactDistance = selectedChip.radius * 2 * RULES.maxMoveDistanceMultiplier;

    // Calculate distance from selected chip to cursor
    const dx = position.x - selectedChip.position.x;
    const dy = position.y - selectedChip.position.y;
    const distanceToCursor = Math.sqrt(dx * dx + dy * dy);

    // If cursor is too close to center, keep phantom at current position
    if (distanceToCursor < selectedChip.radius * 0.5) {
      return;
    }

    // Calculate current phantom angle
    const phantomDx = state.phantomChip.position.x - selectedChip.position.x;
    const phantomDy = state.phantomChip.position.y - selectedChip.position.y;
    const currentAngle = Math.atan2(phantomDy, phantomDx);

    // Calculate target angle from cursor
    const targetAngle = Math.atan2(dy, dx);

    // Calculate angular difference (shortest path)
    let angleDiff = targetAngle - currentAngle;
    
    // Normalize to [-π, π]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Limit angular velocity to prevent sudden flips
    const maxAngleChange = Math.PI / 4; // 45 degrees max per frame (increased for better responsiveness)
    const clampedAngleDiff = Math.max(-maxAngleChange, Math.min(maxAngleChange, angleDiff));

    // Calculate new angle
    const newAngle = currentAngle + clampedAngleDiff;

    // Calculate new position at EXACT distance (critical for validation)
    const forcedPosition = {
      x: selectedChip.position.x + Math.cos(newAngle) * exactDistance,
      y: selectedChip.position.y + Math.sin(newAngle) * exactDistance,
    };

    set({
      phantomChip: {
        ...state.phantomChip,
        position: forcedPosition,
      },
    });
  },

  /**
   * Confirm and execute move
   */
  confirmMove: () => {
    const state = get();
    
    if (!state.phantomChip || !state.selectedChipId) return;

    const selectedChip = state.chips.find((c) => c.id === state.selectedChipId);
    if (!selectedChip) return;

    const maxDistance = selectedChip.radius * 2 * RULES.maxMoveDistanceMultiplier;

    // Validate move using engine
    const validation = validateMove(
      selectedChip,
      state.phantomChip.position,
      maxDistance,
      GAME_CONFIG.board.width,
      GAME_CONFIG.board.height,
      state.chips
    );

    if (!validation.isValid) {
      console.warn(t('errors.invalidMove'), validation.reason);
      return;
    }

    // Check line crossings using engine (with chip's crossed lines history)
    const crossings = checkLineCrossings(
      selectedChip,
      selectedChip.position,
      state.phantomChip.position,
      GAME_CONFIG.scoringLines.y
    );

    const points = calculateCrossingPoints(crossings);
    const newlyCrossedIndices = getNewlyCrossedIndices(crossings);

    // Update chip position and crossed lines
    const updatedChips = state.chips.map((chip) =>
      chip.id === state.selectedChipId
        ? { 
            ...chip, 
            position: state.phantomChip!.position,
            crossedLines: [...chip.crossedLines, ...newlyCrossedIndices],
          }
        : chip
    );

    // Check for captures if chaser moved
    let finalChips = updatedChips;
    let newScore = { ...state.score };

    if (selectedChip.type === ChipType.CHASER) {
      const chaserChip = finalChips.find((c) => c.id === state.selectedChipId)!;
      const runnerChips = finalChips.filter((c) => c.type === ChipType.RUNNER);
      
      const captureResult = detectCaptures(chaserChip, runnerChips);

      if (captureResult.hasCollision) {
        finalChips = finalChips.map((chip) =>
          captureResult.capturedChipIds.includes(chip.id)
            ? { ...chip, isCaptured: true, isActive: false }
            : chip
        );
        newScore.chaser += captureResult.capturedChipIds.length;
      }
    }

    // Add crossing points to appropriate player and trigger animation
    let scoreAnimation: ScoreAnimationData | null = null;
    if (points > 0) {
      if (selectedChip.type === ChipType.CHASER) {
        newScore.chaser += points;
        scoreAnimation = { points, color: '#E95100' };
      } else {
        newScore.runner += points;
        scoreAnimation = { points, color: '#4985DF' };
      }
    }

    // Check if game is over
    const gameOver = isGameOver(finalChips);

    // Update movedChipsThisTurn for runners
    let newMovedChipsThisTurn = [...state.movedChipsThisTurn];
    if (selectedChip.type === ChipType.RUNNER) {
      newMovedChipsThisTurn.push(state.selectedChipId);
    }

    // Determine next phase
    let nextPhase: GamePhase;
    if (gameOver) {
      nextPhase = GamePhase.GAME_OVER;
    } else if (selectedChip.type === ChipType.CHASER) {
      // Chaser moved, now runners turn
      nextPhase = GamePhase.RUNNER_TURN;
      newMovedChipsThisTurn = []; // Clear moved chips
    } else {
      // Runner moved, check if all runners have moved
      const activeRunnerCount = countActiveRunners(finalChips);
      if (newMovedChipsThisTurn.length >= activeRunnerCount) {
        // All runners moved, chaser's turn
        nextPhase = GamePhase.CHASER_TURN;
        newMovedChipsThisTurn = []; // Clear moved chips
      } else {
        // More runners can still move
        nextPhase = GamePhase.RUNNER_TURN;
      }
    }

    // Send move to network if in online multiplayer mode (before clearing phantomChip)
    if (state.mode === GameMode.ONLINE_MULTIPLAYER && state.networkStatus === 'connected') {
      networkManager.sendMove(state.selectedChipId, state.phantomChip!.position);
    }

    // Play walk sound
    soundManager.play('walk');

    // Play win sound if game is over
    if (gameOver) {
      setTimeout(() => soundManager.play('win'), 300);
    }

    set({
      chips: finalChips,
      phantomChip: null,
      selectedChipId: null,
      phase: nextPhase,
      score: newScore,
      turn: state.turn + 1,
      movedChipsThisTurn: newMovedChipsThisTurn,
    });
    
    // Trigger animation after state update (separate call for non-GameState property)
    if (scoreAnimation) {
      (set as any)({ scoreAnimation });
    }
  },

  /**
   * Cancel current move
   */
  cancelMove: () => {
    const state = get();
    
    const previousPhase = state.phase === GamePhase.CHASER_SELECTING
      ? GamePhase.CHASER_TURN
      : GamePhase.RUNNER_TURN;

    set({
      phantomChip: null,
      selectedChipId: null,
      phase: previousPhase,
    });
  },

  /**
   * Reset game to initial state
   */
  resetGame: () => {
    get().initializeGame();
  },

  /**
   * Execute AI turn
   * Called automatically when it's AI's turn in single player mode
   */
  executeAITurn: () => {
    const state = get();

    // Only execute in single player mode
    if (state.mode !== GameMode.SINGLE_PLAYER) return;

    // Check if it's AI's turn
    const isAITurn =
      (state.phase === GamePhase.CHASER_TURN && state.playerRole === ChipType.RUNNER) ||
      (state.phase === GamePhase.RUNNER_TURN && state.playerRole === ChipType.CHASER);

    if (!isAITurn) return;

    // Determine which AI to execute
    if (state.phase === GamePhase.CHASER_TURN) {
      // AI plays as Chaser
      const chaserChip = state.chips.find((c) => c.type === ChipType.CHASER && c.isActive);
      const runnerChips = state.chips.filter((c) => c.type === ChipType.RUNNER);

      if (!chaserChip) return;

      // Calculate AI move
      const aiMove = calculateChaserMove(chaserChip, runnerChips, GAME_CONFIG);

      // Execute move
      executeAIMove(aiMove, state, set);
    } else if (state.phase === GamePhase.RUNNER_TURN) {
      // AI plays as Runners
      const runnerChips = state.chips.filter((c) => c.type === ChipType.RUNNER);
      const chaserChip = state.chips.find((c) => c.type === ChipType.CHASER && c.isActive);

      if (!chaserChip) return;

      // Calculate AI moves for all runners
      const aiMoves = calculateRunnersMoves(runnerChips, chaserChip, GAME_CONFIG);

      // Execute all moves
      executeAIMoves(aiMoves, state, set);
    }
  },

  /**
   * Set game mode
   */
  setGameMode: (mode: GameMode) => {
    set({ mode });
  },

  /**
   * Set player role (only relevant in single player mode)
   */
  setPlayerRole: (role: ChipType) => {
    set({ playerRole: role });
  },

  /**
   * Connect to online multiplayer room
   */
  connectToRoom: (roomId: string, playerId: string) => {
    const state = get();
    const playerName = state.playerName || 'Игрок';
    
    // 1. CLEANUP: Remove old callbacks to prevent duplication on reconnect
    networkManager.removeAllCallbacks();
    
    set({ networkStatus: 'connecting', roomId, playerId });

    // Setup network callbacks
    networkManager.onConnectionChange((status) => {
      set({ networkStatus: status === 'connected' ? 'connected' : 'disconnected' });
    });

    networkManager.onMoveReceived((moveData) => {
      get().receiveNetworkMove(moveData);
    });

    networkManager.onRoleAssigned((role) => {
      console.log('Role assigned by server:', role);
      console.log('Current playerRole before update:', get().playerRole);
      set({ playerRole: role });
      console.log('PlayerRole updated in store to:', role);
      console.log('Current playerRole after update:', get().playerRole);
    });

    networkManager.onOpponentName((name) => {
      console.log('Opponent name received:', name);
      set({ opponentName: name });
    });

    networkManager.onError((error) => {
      console.error('Network error:', error);
      set({ networkStatus: 'disconnected' });
    });

    // Connect to server with player name
    networkManager.connect(roomId, playerId, playerName);

    // Save session for auto-restore on page reload
    sessionManager.saveSession(roomId, playerId, playerName);
  },

  /**
   * Disconnect from online multiplayer room
   */
  disconnectFromRoom: () => {
    networkManager.disconnect();
    networkManager.removeAllCallbacks();

    // Clear saved session
    sessionManager.clearSession();

    set({
      networkStatus: 'disconnected',
      roomId: null,
      playerId: null,
      opponentName: null,
      mode: GameMode.HOTSEAT, // Fallback to hotseat
    });
  },

  /**
   * Receive and apply opponent's move from network
   */
  receiveNetworkMove: (moveData: NetworkMoveData) => {
    const state = get();

    // Ignore moves from self
    if (moveData.playerId === state.playerId) {
      return;
    }

    const chip = state.chips.find((c) => c.id === moveData.chipId);
    if (!chip) {
      console.error('Received move for unknown chip:', moveData.chipId);
      return;
    }

    const maxDistance = chip.radius * 2 * RULES.maxMoveDistanceMultiplier;

    // Validate move using engine
    const validation = validateMove(
      chip,
      moveData.targetPosition,
      maxDistance,
      GAME_CONFIG.board.width,
      GAME_CONFIG.board.height,
      state.chips
    );

    if (!validation.isValid) {
      console.error('Invalid network move:', validation.reason);
      return;
    }

    // Check line crossings
    const crossings = checkLineCrossings(
      chip,
      chip.position,
      moveData.targetPosition,
      GAME_CONFIG.scoringLines.y
    );

    const points = calculateCrossingPoints(crossings);
    const newlyCrossedIndices = getNewlyCrossedIndices(crossings);

    // Debug logging for position updates
    console.log('Updating chip position:', {
      chipId: moveData.chipId,
      oldPosition: chip.position,
      newPosition: moveData.targetPosition,
    });

    // Update chip position and crossed lines
    const updatedChips = state.chips.map((c) =>
      c.id === moveData.chipId
        ? { 
            ...c, 
            position: { x: moveData.targetPosition.x, y: moveData.targetPosition.y },
            crossedLines: [...c.crossedLines, ...newlyCrossedIndices],
          }
        : c
    );

    // Check for captures if chaser moved
    let finalChips = updatedChips;
    let newScore = { ...state.score };

    if (chip.type === ChipType.CHASER) {
      const chaserChip = finalChips.find((c) => c.id === moveData.chipId)!;
      const runnerChips = finalChips.filter((c) => c.type === ChipType.RUNNER);
      
      const captureResult = detectCaptures(chaserChip, runnerChips);

      if (captureResult.hasCollision) {
        finalChips = finalChips.map((c) =>
          captureResult.capturedChipIds.includes(c.id)
            ? { ...c, isCaptured: true, isActive: false }
            : c
        );
        newScore.chaser += captureResult.capturedChipIds.length;
      }
    }

    // Add crossing points and trigger animation
    let scoreAnimation: ScoreAnimationData | null = null;
    if (points > 0) {
      if (chip.type === ChipType.CHASER) {
        newScore.chaser += points;
        scoreAnimation = { points, color: '#E95100' };
      } else {
        newScore.runner += points;
        scoreAnimation = { points, color: '#4985DF' };
      }
    }

    // Check if game is over
    const gameOver = isGameOver(finalChips);

    // Update movedChipsThisTurn for runners
    let newMovedChipsThisTurn = [...state.movedChipsThisTurn];
    if (chip.type === ChipType.RUNNER) {
      newMovedChipsThisTurn.push(moveData.chipId);
    }

    // Determine next phase
    let nextPhase: GamePhase;
    if (gameOver) {
      nextPhase = GamePhase.GAME_OVER;
    } else if (chip.type === ChipType.CHASER) {
      nextPhase = GamePhase.RUNNER_TURN;
      newMovedChipsThisTurn = [];
    } else {
      const activeRunnerCount = countActiveRunners(finalChips);
      if (newMovedChipsThisTurn.length >= activeRunnerCount) {
        nextPhase = GamePhase.CHASER_TURN;
        newMovedChipsThisTurn = [];
      } else {
        nextPhase = GamePhase.RUNNER_TURN;
      }
    }

    set({
      chips: finalChips,
      phase: nextPhase,
      score: newScore,
      turn: state.turn + 1,
      movedChipsThisTurn: newMovedChipsThisTurn,
    });
    
    // Trigger animation after state update (separate call for non-GameState property)
    if (scoreAnimation) {
      (set as any)({ scoreAnimation });
    }
  },
}));

/**
 * Execute a single AI move (for Chaser)
 */
function executeAIMove(
  aiMove: AIMove,
  state: GameState,
  set: (partial: Partial<GameState>) => void
) {
  const chip = state.chips.find((c) => c.id === aiMove.chipId);
  if (!chip) return;

  // Check line crossings with chip's history
  const crossings = checkLineCrossings(
    chip,
    chip.position,
    aiMove.targetPosition,
    GAME_CONFIG.scoringLines.y
  );

  const points = calculateCrossingPoints(crossings);
  const newlyCrossedIndices = getNewlyCrossedIndices(crossings);

  // Update chip position and crossed lines
  const updatedChips = state.chips.map((c) =>
    c.id === aiMove.chipId 
      ? { 
          ...c, 
          position: aiMove.targetPosition,
          crossedLines: [...c.crossedLines, ...newlyCrossedIndices],
        } 
      : c
  );

  // Check for captures if chaser moved
  let finalChips = updatedChips;
  let newScore = { ...state.score };

  if (chip.type === ChipType.CHASER) {
    const chaserChip = finalChips.find((c) => c.id === aiMove.chipId)!;
    const runnerChips = finalChips.filter((c) => c.type === ChipType.RUNNER);

    const captureResult = detectCaptures(chaserChip, runnerChips);

    if (captureResult.hasCollision) {
      finalChips = finalChips.map((c) =>
        captureResult.capturedChipIds.includes(c.id)
          ? { ...c, isCaptured: true, isActive: false }
          : c
      );
      newScore.chaser += captureResult.capturedChipIds.length;
    }
  }

  // Add crossing points and trigger animation
  let scoreAnimation: ScoreAnimationData | null = null;
  if (points > 0) {
    if (chip.type === ChipType.CHASER) {
      newScore.chaser += points;
      scoreAnimation = { points, color: '#E95100' };
    } else {
      newScore.runner += points;
      scoreAnimation = { points, color: '#4985DF' };
    }
  }

  // Check if game is over
  const gameOver = isGameOver(finalChips);

  // Switch turns
  const nextPhase = gameOver
    ? GamePhase.GAME_OVER
    : GamePhase.RUNNER_TURN;

  set({
    chips: finalChips,
    phase: nextPhase,
    score: newScore,
    turn: state.turn + 1,
    movedChipsThisTurn: [], // Clear for next turn
  });
  
  // Trigger animation after state update (separate call for non-GameState property)
  if (scoreAnimation) {
    (set as any)({ scoreAnimation });
  }
}

/**
 * Execute multiple AI moves (for Runners)
 */
function executeAIMoves(
  aiMoves: AIMove[],
  state: GameState,
  set: (partial: Partial<GameState>) => void
) {
  let updatedChips = [...state.chips];
  let newScore = { ...state.score };

  // Execute all moves and accumulate points
  for (const aiMove of aiMoves) {
    const chip = updatedChips.find((c) => c.id === aiMove.chipId);
    if (!chip) continue;

    // Check line crossings with chip's history
    const crossings = checkLineCrossings(
      chip,
      chip.position,
      aiMove.targetPosition,
      GAME_CONFIG.scoringLines.y
    );

    const points = calculateCrossingPoints(crossings);
    const newlyCrossedIndices = getNewlyCrossedIndices(crossings);

    // Update chip position and crossed lines
    updatedChips = updatedChips.map((c) =>
      c.id === aiMove.chipId 
        ? { 
            ...c, 
            position: aiMove.targetPosition,
            crossedLines: [...c.crossedLines, ...newlyCrossedIndices],
          } 
        : c
    );

    // Add crossing points
    if (points > 0) {
      newScore.runner += points;
    }
  }

  // Trigger animation if any points were scored
  let scoreAnimation: ScoreAnimationData | null = null;
  if (newScore.runner > state.score.runner) {
    const totalPoints = newScore.runner - state.score.runner;
    scoreAnimation = { points: totalPoints, color: '#4985DF' };
  }

  // Check if game is over
  const gameOver = isGameOver(updatedChips);

  // Switch turns
  const nextPhase = gameOver
    ? GamePhase.GAME_OVER
    : GamePhase.CHASER_TURN;

  set({
    chips: updatedChips,
    phase: nextPhase,
    score: newScore,
    turn: state.turn + 1,
    movedChipsThisTurn: [], // Clear for next turn
  });
  
  // Trigger animation after state update (separate call for non-GameState property)
  if (scoreAnimation) {
    (set as any)({ scoreAnimation });
  }
}
