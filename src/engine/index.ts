/**
 * GAME ENGINE - Public API
 * 
 * Central export point for all engine functionality
 * This is the interface between the game logic and the UI/Store
 */

// Math utilities
export {
  calculateDistance,
  checkCircleCollision,
  isValidMoveDistance,
  crossesHorizontalLine,
  isWithinBounds,
  calculateAngle,
  clampToMaxDistance,
  forceExactDistance,
  normalizeVector,
} from './math';

// Collision detection
export {
  detectCaptures,
  hasChipCollision,
  getActiveChipsByType,
  countActiveRunners,
  isGameOver,
} from './collision';

// Move validation
export {
  validateMove,
  checkLineCrossings,
  calculateCrossingPoints,
  getNewlyCrossedIndices,
  validateChipSelection,
} from './validation';

// AI logic
export {
  calculateChaserMove,
  calculateRunnersMoves,
} from './ai';
