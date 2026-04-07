import { Position } from '../types';

/**
 * PURE MATH ENGINE - Framework Agnostic
 * 
 * All functions here are pure (no side effects, no external dependencies)
 * This module can be replaced with backend calls (Rust/Tauri) without touching UI
 * 
 * Design principle: Input → Calculation → Output
 */

/**
 * Calculate Euclidean distance between two points
 * @param p1 First position
 * @param p2 Second position
 * @returns Distance in pixels
 */
export function calculateDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two circles overlap (collision detection)
 * @param center1 Center of first circle
 * @param radius1 Radius of first circle
 * @param center2 Center of second circle
 * @param radius2 Radius of second circle
 * @returns True if circles overlap
 */
export function checkCircleCollision(
  center1: Position,
  radius1: number,
  center2: Position,
  radius2: number
): boolean {
  const distance = calculateDistance(center1, center2);
  return distance <= radius1 + radius2;
}

/**
 * Validate if a move is within allowed distance
 * Includes tolerance for floating point precision errors
 * @param from Starting position
 * @param to Target position
 * @param maxDistance Maximum allowed distance
 * @returns True if move is valid
 */
export function isValidMoveDistance(
  from: Position,
  to: Position,
  maxDistance: number
): boolean {
  const distance = calculateDistance(from, to);
  // Add 0.1px tolerance for floating point precision
  return distance <= maxDistance + 0.1;
}

/**
 * Check if a line segment crosses a horizontal line
 * @param start Start position of movement
 * @param end End position of movement
 * @param lineY Y-coordinate of horizontal line
 * @returns True if line segment crosses the horizontal line
 */
export function crossesHorizontalLine(
  start: Position,
  end: Position,
  lineY: number
): boolean {
  // Check if movement crosses the line (one point above, one below)
  const startAbove = start.y < lineY;
  const endAbove = end.y < lineY;
  
  // Crossing occurs when start and end are on opposite sides
  return startAbove !== endAbove;
}

/**
 * Check if position is within board boundaries
 * @param position Position to check
 * @param boardWidth Board width
 * @param boardHeight Board height
 * @param chipRadius Chip radius (to account for chip size)
 * @returns True if position is valid
 */
export function isWithinBounds(
  position: Position,
  boardWidth: number,
  boardHeight: number,
  chipRadius: number
): boolean {
  return (
    position.x >= chipRadius &&
    position.x <= boardWidth - chipRadius &&
    position.y >= chipRadius &&
    position.y <= boardHeight - chipRadius
  );
}

/**
 * Calculate angle between two points (in radians)
 * @param from Starting position
 * @param to Target position
 * @returns Angle in radians
 */
export function calculateAngle(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Force position to exact distance from origin (for strict "touching" movement)
 * Used for Sonor game rule: chip moves exactly 2R (diameter) distance
 * @param origin Origin position
 * @param target Target position (direction indicator)
 * @param exactDistance Exact distance to enforce
 * @returns Position at exact distance from origin in direction of target
 */
export function forceExactDistance(
  origin: Position,
  target: Position,
  exactDistance: number
): Position {
  const angle = calculateAngle(origin, target);
  return {
    x: origin.x + Math.cos(angle) * exactDistance,
    y: origin.y + Math.sin(angle) * exactDistance,
  };
}

/**
 * Clamp a position to maximum distance from origin
 * @param origin Origin position
 * @param target Target position
 * @param maxDistance Maximum allowed distance
 * @returns Clamped position
 */
export function clampToMaxDistance(
  origin: Position,
  target: Position,
  maxDistance: number
): Position {
  const distance = calculateDistance(origin, target);
  
  if (distance <= maxDistance) {
    return target;
  }
  
  const angle = calculateAngle(origin, target);
  return {
    x: origin.x + Math.cos(angle) * maxDistance,
    y: origin.y + Math.sin(angle) * maxDistance,
  };
}

/**
 * Normalize a vector
 * @param vector Vector to normalize
 * @returns Normalized vector
 */
export function normalizeVector(vector: Position): Position {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}
