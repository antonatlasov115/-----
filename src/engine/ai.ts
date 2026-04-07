import { Chip, ChipType, Position, AIMove, GameConfig } from '../types';
import {
  calculateDistance,
  calculateAngle,
  clampToMaxDistance,
  normalizeVector,
} from './math';
import { getActiveChipsByType } from './collision';

/**
 * AI ENGINE - Framework Agnostic
 * 
 * Pure functions for AI decision making
 * No side effects, no state mutations
 * Can be replaced with backend AI service
 */

/**
 * Calculate optimal move for Chaser (AI playing as pursuer)
 * Strategy: Chase the nearest runner, prioritizing those close to scoring lines
 * 
 * @param chaser The chaser chip
 * @param runners Array of runner chips
 * @param config Game configuration
 * @returns Optimal move for chaser
 */
export function calculateChaserMove(
  chaser: Chip,
  runners: Chip[],
  config: GameConfig
): AIMove {
  const activeRunners = getActiveChipsByType(runners, ChipType.RUNNER);

  if (activeRunners.length === 0) {
    // No runners left, return current position
    return {
      chipId: chaser.id,
      targetPosition: chaser.position,
    };
  }

  // Find the most threatening runner (closest to scoring lines or closest to chaser)
  let targetRunner = activeRunners[0];
  let bestScore = -Infinity;

  for (const runner of activeRunners) {
    const distanceToChaser = calculateDistance(chaser.position, runner.position);
    
    // Calculate distance to nearest scoring line
    const distancesToLines = config.scoringLines.y.map(lineY => 
      Math.abs(runner.position.y - lineY)
    );
    const minDistanceToLine = Math.min(...distancesToLines);

    // Scoring: prioritize runners close to lines, but also consider proximity
    // Lower distance to line = higher threat
    // Lower distance to chaser = easier to catch
    const threatScore = (1000 - minDistanceToLine) + (500 - distanceToChaser);

    if (threatScore > bestScore) {
      bestScore = threatScore;
      targetRunner = runner;
    }
  }

  // Calculate direction vector towards target
  const angle = calculateAngle(chaser.position, targetRunner.position);
  const maxDistance = chaser.radius * 2; // Chip diameter

  // Calculate target position (move maximum distance towards runner)
  const targetPosition: Position = {
    x: chaser.position.x + Math.cos(angle) * maxDistance,
    y: chaser.position.y + Math.sin(angle) * maxDistance,
  };

  // Clamp to board boundaries
  const clampedPosition = clampToMaxDistance(
    chaser.position,
    targetPosition,
    maxDistance
  );

  // Ensure within board bounds
  const finalPosition: Position = {
    x: Math.max(chaser.radius, Math.min(config.board.width - chaser.radius, clampedPosition.x)),
    y: Math.max(chaser.radius, Math.min(config.board.height - chaser.radius, clampedPosition.y)),
  };

  return {
    chipId: chaser.id,
    targetPosition: finalPosition,
  };
}

/**
 * Calculate optimal moves for all Runners (AI playing as evaders)
 * Strategy: Move towards scoring lines while evading the chaser
 * 
 * @param runners Array of runner chips
 * @param chaser The chaser chip
 * @param config Game configuration
 * @returns Array of moves for all active runners
 */
export function calculateRunnersMoves(
  runners: Chip[],
  chaser: Chip,
  config: GameConfig
): AIMove[] {
  const activeRunners = getActiveChipsByType(runners, ChipType.RUNNER);
  const moves: AIMove[] = [];

  for (const runner of activeRunners) {
    const move = calculateSingleRunnerMove(runner, chaser, config);
    moves.push(move);
  }

  return moves;
}

/**
 * Calculate optimal move for a single runner
 * 
 * @param runner The runner chip
 * @param chaser The chaser chip
 * @param config Game configuration
 * @returns Optimal move for this runner
 */
function calculateSingleRunnerMove(
  runner: Chip,
  chaser: Chip,
  config: GameConfig
): AIMove {
  const maxDistance = runner.radius * 2; // Chip diameter
  const distanceToChaser = calculateDistance(runner.position, chaser.position);
  const dangerThreshold = chaser.radius * 4; // Danger zone

  // Determine target direction (towards furthest scoring line)
  const topLine = Math.min(...config.scoringLines.y);
  const bottomLine = Math.max(...config.scoringLines.y);
  
  // Move towards the line that's furthest away
  const distanceToTop = Math.abs(runner.position.y - topLine);
  const distanceToBottom = Math.abs(runner.position.y - bottomLine);
  
  let targetY: number;
  if (distanceToTop > distanceToBottom) {
    targetY = topLine; // Move towards top
  } else {
    targetY = bottomLine; // Move towards bottom
  }

  // Base direction: towards target line
  let directionVector: Position = {
    x: 0,
    y: targetY - runner.position.y,
  };

  // If chaser is too close, add evasion vector
  if (distanceToChaser < dangerThreshold) {
    // Calculate vector away from chaser
    const angleFromChaser = calculateAngle(chaser.position, runner.position);
    const evasionStrength = 1 - (distanceToChaser / dangerThreshold); // 0 to 1

    // Add evasion component (stronger when chaser is closer)
    directionVector.x += Math.cos(angleFromChaser) * maxDistance * evasionStrength * 2;
    directionVector.y += Math.sin(angleFromChaser) * maxDistance * evasionStrength * 2;
  }

  // Normalize and scale to max distance
  const normalized = normalizeVector(directionVector);
  const targetPosition: Position = {
    x: runner.position.x + normalized.x * maxDistance,
    y: runner.position.y + normalized.y * maxDistance,
  };

  // Clamp to max distance from current position
  const clampedPosition = clampToMaxDistance(
    runner.position,
    targetPosition,
    maxDistance
  );

  // Ensure within board bounds
  const finalPosition: Position = {
    x: Math.max(runner.radius, Math.min(config.board.width - runner.radius, clampedPosition.x)),
    y: Math.max(runner.radius, Math.min(config.board.height - runner.radius, clampedPosition.y)),
  };

  return {
    chipId: runner.id,
    targetPosition: finalPosition,
  };
}
