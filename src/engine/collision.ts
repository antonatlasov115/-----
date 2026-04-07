import { Chip, ChipType, CollisionResult } from '../types';
import { checkCircleCollision } from './math';

/**
 * COLLISION ENGINE - Framework Agnostic
 * 
 * Handles all collision detection logic
 * Pure functions that can be replaced with backend implementation
 */

/**
 * Detect collisions between chaser and runners
 * @param chaserChip The chaser chip
 * @param runnerChips Array of runner chips
 * @returns Collision result with captured chip IDs
 */
export function detectCaptures(
  chaserChip: Chip,
  runnerChips: Chip[]
): CollisionResult {
  const capturedChipIds: string[] = [];

  for (const runner of runnerChips) {
    // Skip already captured or inactive runners
    if (runner.isCaptured || !runner.isActive) {
      continue;
    }

    // Check collision between chaser and runner
    const hasCollision = checkCircleCollision(
      chaserChip.position,
      chaserChip.radius,
      runner.position,
      runner.radius
    );

    if (hasCollision) {
      capturedChipIds.push(runner.id);
    }
  }

  return {
    hasCollision: capturedChipIds.length > 0,
    capturedChipIds,
  };
}

/**
 * Check if a chip collides with any other chip (for move validation)
 * @param movingChip The chip that is moving
 * @param allChips All chips on the board
 * @returns True if collision detected
 */
export function hasChipCollision(
  movingChip: Chip,
  allChips: Chip[]
): boolean {
  for (const chip of allChips) {
    // Skip self and inactive chips
    if (chip.id === movingChip.id || !chip.isActive || chip.isCaptured) {
      continue;
    }

    const hasCollision = checkCircleCollision(
      movingChip.position,
      movingChip.radius,
      chip.position,
      chip.radius
    );

    if (hasCollision) {
      return true;
    }
  }

  return false;
}

/**
 * Get all active chips of a specific type
 * @param chips All chips
 * @param type Chip type to filter
 * @returns Filtered chips
 */
export function getActiveChipsByType(
  chips: Chip[],
  type: ChipType
): Chip[] {
  return chips.filter(
    (chip) => chip.type === type && chip.isActive && !chip.isCaptured
  );
}

/**
 * Count remaining active runners
 * @param chips All chips
 * @returns Number of active runners
 */
export function countActiveRunners(chips: Chip[]): number {
  return getActiveChipsByType(chips, ChipType.RUNNER).length;
}

/**
 * Check if game is over
 * Game ends when:
 * 1. All runners are captured, OR
 * 2. At least one runner has crossed all three lines (reached the opposite side)
 * @param chips All chips
 * @returns True if game is over
 */
export function isGameOver(chips: Chip[]): boolean {
  // Check if all runners are captured
  if (countActiveRunners(chips) === 0) {
    return true;
  }
  
  // Check if any runner has crossed all three lines (indices 0, 1, 2)
  const runners = getActiveChipsByType(chips, ChipType.RUNNER);
  for (const runner of runners) {
    if (runner.crossedLines.includes(0) && 
        runner.crossedLines.includes(1) && 
        runner.crossedLines.includes(2)) {
      return true;
    }
  }
  
  return false;
}
