import { Position, Chip, ChipType, MoveValidation, LineCrossingResult } from '../types';
import { isValidMoveDistance, isWithinBounds, crossesHorizontalLine } from './math';
import { hasChipCollision } from './collision';

/**
 * VALIDATION ENGINE - Framework Agnostic
 * 
 * Validates all game moves and actions
 * Pure functions that can be replaced with backend implementation
 */

/**
 * Validate if a move is legal
 * @param chip The chip being moved
 * @param targetPosition Target position
 * @param maxDistance Maximum allowed move distance
 * @param boardWidth Board width
 * @param boardHeight Board height
 * @param allChips All chips on board (for collision check)
 * @returns Validation result
 */
export function validateMove(
  chip: Chip,
  targetPosition: Position,
  maxDistance: number,
  boardWidth: number,
  boardHeight: number,
  allChips: Chip[]
): MoveValidation {
  // Check if move is within allowed distance
  if (!isValidMoveDistance(chip.position, targetPosition, maxDistance)) {
    return {
      isValid: false,
      reason: `Move exceeds maximum distance of ${maxDistance}px`,
    };
  }

  // Check if target position is within board bounds
  if (!isWithinBounds(targetPosition, boardWidth, boardHeight, chip.radius)) {
    return {
      isValid: false,
      reason: 'Move is outside board boundaries',
    };
  }

  // Create temporary chip at target position for collision check
  const tempChip: Chip = {
    ...chip,
    position: targetPosition,
  };

  // Check if move would cause collision with other chips
  // IMPORTANT: Chaser is ALLOWED to collide with runners (that's how capture works!)
  // Only prevent collision between chips of the same type
  if (hasChipCollision(tempChip, allChips)) {
    // Allow chaser to move into runner position (capture)
    // But prevent same-type collisions
    const collidingChips = allChips.filter(otherChip => {
      if (otherChip.id === chip.id || !otherChip.isActive || otherChip.isCaptured) {
        return false;
      }
      
      const dx = targetPosition.x - otherChip.position.x;
      const dy = targetPosition.y - otherChip.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= chip.radius + otherChip.radius;
    });
    
    // Check if any colliding chip is same type
    const hasSameTypeCollision = collidingChips.some(
      otherChip => otherChip.type === chip.type
    );
    
    if (hasSameTypeCollision) {
      return {
        isValid: false,
        reason: 'Move would collide with another chip of the same type',
      };
    }
  }

  return {
    isValid: true,
  };
}

/**
 * Check if a move crosses any scoring lines
 * Only awards points for lines not previously crossed by this chip
 * Points: 1 point for each line crossed (only for runners)
 * @param chip The chip being moved
 * @param startPosition Starting position
 * @param endPosition Ending position
 * @param scoringLinesY Array of Y coordinates of scoring lines
 * @returns Array of line crossing results with newly crossed indices
 */
export function checkLineCrossings(
  chip: Chip,
  startPosition: Position,
  endPosition: Position,
  scoringLinesY: number[]
): LineCrossingResult[] {
  const crossings: LineCrossingResult[] = [];
  const newlyCrossedIndices: number[] = [];

  for (let i = 0; i < scoringLinesY.length; i++) {
    const lineY = scoringLinesY[i];
    
    // Check if line was crossed during this move
    if (crossesHorizontalLine(startPosition, endPosition, lineY)) {
      // Only award points if this line hasn't been crossed before
      const alreadyCrossed = chip.crossedLines.includes(i);
      
      if (!alreadyCrossed) {
        newlyCrossedIndices.push(i);
        
        // Only runners earn points (1 point per line)
        // Chaser (hunter) doesn't earn points
        const pointsEarned = chip.type === ChipType.RUNNER ? 1 : 0;

        crossings.push({
          hasCrossed: true,
          lineIndex: i,
          points: pointsEarned,
          newlyCrossedIndices: [i],
        });
      }
    }
  }

  return crossings;
}

/**
 * Calculate total points from line crossings
 * @param crossings Array of line crossing results
 * @returns Total points
 */
export function calculateCrossingPoints(
  crossings: LineCrossingResult[]
): number {
  return crossings.reduce((total, crossing) => total + crossing.points, 0);
}

/**
 * Get all newly crossed line indices from crossings
 * @param crossings Array of line crossing results
 * @returns Array of newly crossed line indices
 */
export function getNewlyCrossedIndices(
  crossings: LineCrossingResult[]
): number[] {
  const indices: number[] = [];
  for (const crossing of crossings) {
    indices.push(...crossing.newlyCrossedIndices);
  }
  return indices;
}

/**
 * Validate if a chip can be selected
 * @param chip The chip to select
 * @returns Validation result
 */
export function validateChipSelection(chip: Chip): MoveValidation {
  if (!chip.isActive) {
    return {
      isValid: false,
      reason: 'Chip is not active',
    };
  }

  if (chip.isCaptured) {
    return {
      isValid: false,
      reason: 'Chip has been captured',
    };
  }

  return {
    isValid: true,
  };
}
