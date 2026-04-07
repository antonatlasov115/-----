import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './useGameStore';
import { NetworkMoveData, ChipType, GameMode } from '../types';

/**
 * BUG CONDITION EXPLORATION TEST
 * 
 * Property 1: Bug Condition - Network Move Visual Update
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Bug: When receiveNetworkMove is called with opponent's move data,
 * the chip's visual position does not update on screen because React
 * doesn't detect changes due to shallow comparison.
 * 
 * Root Cause Hypothesis:
 * - Chip object reference stays the same (shallow comparison issue)
 * - Position object uses same reference instead of deep copy
 * - React reconciliation doesn't detect changes
 * 
 * Expected Behavior (after fix):
 * - Chip object reference changes (new object created)
 * - Position object reference changes (deep copy)
 * - Component re-renders with animation
 * 
 * Validates: Requirements 2.1, 2.2, 2.3
 */

describe('Bug Condition Exploration - Network Move Visual Update', () => {
  beforeEach(() => {
    useGameStore.getState().initializeGame();
    useGameStore.getState().setGameMode(GameMode.ONLINE_MULTIPLAYER);
    useGameStore.getState().setPlayerRole(ChipType.CHASER);
  });

  it('EXPLORATION: Chip object reference should change when receiving network move', () => {
    // Arrange: Get initial chip reference
    const state = useGameStore.getState();
    const initialChip = state.chips.find((c) => c.id === 'runner-0');
    
    expect(initialChip).toBeDefined();
    const initialChipReference = initialChip!;
    const initialPosition = initialChip!.position;

    // Calculate valid move: exactly 40px away (runner diameter)
    // Initial position: { x: 100, y: 780 }
    // Move 40px to the right: { x: 140, y: 780 }
    const targetPosition = { x: 140, y: 780 };

    // Act: Simulate receiving opponent's move
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-0',
      targetPosition,
      playerId: 'opponent-player',
      timestamp: Date.now(),
    };

    state.receiveNetworkMove(mockMoveData);

    // Assert: Get updated chip reference
    const updatedState = useGameStore.getState();
    const updatedChip = updatedState.chips.find((c) => c.id === 'runner-0');

    expect(updatedChip).toBeDefined();

    // CRITICAL TEST: Chip object reference MUST change for React to detect update
    // EXPECTED: This assertion FAILS on unfixed code (proves bug exists)
    expect(updatedChip).not.toBe(initialChipReference);
    
    // Position should be updated
    expect(updatedChip!.position.x).toBe(140);
    expect(updatedChip!.position.y).toBe(780);
    
    // Position should NOT be the same reference as initial
    expect(updatedChip!.position).not.toBe(initialPosition);
  });

  it('EXPLORATION: Position object reference should change (deep copy)', () => {
    // Arrange: Get initial position reference
    const state = useGameStore.getState();
    const initialChip = state.chips.find((c) => c.id === 'runner-1');
    
    expect(initialChip).toBeDefined();
    const initialPositionReference = initialChip!.position;

    // Calculate valid move: exactly 40px away (runner diameter)
    // Initial position: { x: 200, y: 780 }
    // Move 40px to the right: { x: 240, y: 780 }
    const newPosition = { x: 240, y: 780 };

    // Act: Simulate receiving opponent's move
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-1',
      targetPosition: newPosition,
      playerId: 'opponent-player',
      timestamp: Date.now(),
    };

    state.receiveNetworkMove(mockMoveData);

    // Assert: Get updated position reference
    const updatedState = useGameStore.getState();
    const updatedChip = updatedState.chips.find((c) => c.id === 'runner-1');

    expect(updatedChip).toBeDefined();

    // CRITICAL TEST: Position object MUST be deep copied (new reference)
    // EXPECTED: This assertion FAILS on unfixed code (proves bug exists)
    expect(updatedChip!.position).not.toBe(initialPositionReference);
    
    // Position should also NOT be the same reference as the input
    expect(updatedChip!.position).not.toBe(newPosition);
    
    // But values should match
    expect(updatedChip!.position.x).toBe(240);
    expect(updatedChip!.position.y).toBe(780);
  });

  it('EXPLORATION: Multiple rapid network moves should all update references', () => {
    // Arrange: Track chip references across multiple moves
    const state = useGameStore.getState();
    const chipReferences: any[] = [];
    const positionReferences: any[] = [];

    // Store initial references
    const initialChip = state.chips.find((c) => c.id === 'runner-2');
    chipReferences.push(initialChip);
    positionReferences.push(initialChip!.position);

    // Act: Simulate 3 rapid network moves (each 40px away from previous)
    // Initial position: { x: 300, y: 780 }
    const moves = [
      { x: 340, y: 780 },  // 40px right
      { x: 340, y: 740 },  // 40px up
      { x: 300, y: 740 },  // 40px left
    ];

    moves.forEach((targetPosition) => {
      const mockMoveData: NetworkMoveData = {
        chipId: 'runner-2',
        targetPosition,
        playerId: 'opponent-player',
        timestamp: Date.now(),
      };

      useGameStore.getState().receiveNetworkMove(mockMoveData);

      // Store references after each move
      const updatedChip = useGameStore.getState().chips.find((c) => c.id === 'runner-2');
      chipReferences.push(updatedChip);
      positionReferences.push(updatedChip!.position);
    });

    // Assert: All chip references should be different
    // EXPECTED: These assertions FAIL on unfixed code (proves bug exists)
    for (let i = 0; i < chipReferences.length - 1; i++) {
      for (let j = i + 1; j < chipReferences.length; j++) {
        expect(chipReferences[i]).not.toBe(chipReferences[j]);
        expect(positionReferences[i]).not.toBe(positionReferences[j]);
      }
    }

    // Final position should match last move
    const finalChip = chipReferences[chipReferences.length - 1];
    expect(finalChip.position.x).toBe(300);
    expect(finalChip.position.y).toBe(740);
  });

  it('EXPLORATION: Nested arrays (crossedLines) should also be copied', () => {
    // Arrange: Get initial chip with crossed lines
    const state = useGameStore.getState();
    const initialChip = state.chips.find((c) => c.id === 'runner-3');
    
    expect(initialChip).toBeDefined();
    const initialCrossedLinesReference = initialChip!.crossedLines;

    // Act: Simulate move that crosses a scoring line
    // Initial position: { x: 400, y: 780 }
    // Move to cross first scoring line at y=760: { x: 400, y: 740 }
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-3',
      targetPosition: { x: 400, y: 740 },
      playerId: 'opponent-player',
      timestamp: Date.now(),
    };

    state.receiveNetworkMove(mockMoveData);

    // Assert: crossedLines array should be a new reference
    const updatedState = useGameStore.getState();
    const updatedChip = updatedState.chips.find((c) => c.id === 'runner-3');

    expect(updatedChip).toBeDefined();

    // CRITICAL TEST: crossedLines array MUST be copied (new reference)
    // EXPECTED: This assertion FAILS on unfixed code if array is mutated
    expect(updatedChip!.crossedLines).not.toBe(initialCrossedLinesReference);
  });

  it('EDGE CASE: Own moves should be ignored (not a bug condition)', () => {
    // Arrange: Set player ID
    const state = useGameStore.getState();
    useGameStore.setState({ playerId: 'my-player-id' });

    const initialChip = state.chips.find((c) => c.id === 'runner-4');
    const initialChipReference = initialChip!;

    // Act: Simulate receiving own move (should be ignored)
    // Initial position: { x: 500, y: 780 }
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-4',
      targetPosition: { x: 540, y: 780 },
      playerId: 'my-player-id', // Same as current player
      timestamp: Date.now(),
    };

    state.receiveNetworkMove(mockMoveData);

    // Assert: Chip should NOT be updated (move ignored)
    const updatedState = useGameStore.getState();
    const updatedChip = updatedState.chips.find((c) => c.id === 'runner-4');

    // Chip reference should be the same (no update)
    expect(updatedChip).toBe(initialChipReference);
    
    // Position should not change
    expect(updatedChip!.position).toBe(initialChipReference.position);
  });
});
