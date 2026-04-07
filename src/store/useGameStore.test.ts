import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './useGameStore';
import { networkManager } from '../network/socket';
import { NetworkMoveData, ChipType } from '../types';

/**
 * INTEGRATION TEST: Bug Condition Exploration via Store
 * 
 * This test simulates the real user flow through useGameStore.connectToRoom()
 * which should call networkManager.removeAllCallbacks() before registering new ones.
 * 
 * Property 1: Bug Condition - Event Handler Duplication on Reconnection
 * 
 * Expected behavior after fix: Each network event should be handled exactly once,
 * regardless of the number of reconnections.
 */

describe('useGameStore - Bug Condition Exploration (Integration)', () => {
  beforeEach(() => {
    // Clean up before each test
    networkManager.disconnect();
    networkManager.removeAllCallbacks();
    useGameStore.getState().initializeGame();
  });

  it('FIXED: Double reconnection via store should handle events once', () => {
    // Arrange: Track how many times receiveNetworkMove is called
    let moveReceivedCount = 0;
    const originalReceiveNetworkMove = useGameStore.getState().receiveNetworkMove;
    
    // Spy on receiveNetworkMove
    const receiveNetworkMoveSpy = vi.fn((moveData: NetworkMoveData) => {
      moveReceivedCount++;
      originalReceiveNetworkMove(moveData);
    });

    // Mock receiveNetworkMove
    useGameStore.setState({ receiveNetworkMove: receiveNetworkMoveSpy });

    // Act: Connect → Disconnect → Connect (simulating reconnection)
    // First connection
    useGameStore.getState().connectToRoom('test-room', 'player-1');
    
    // Disconnect
    useGameStore.getState().disconnectFromRoom();
    
    // Second connection (this is where the bug would manifest)
    useGameStore.getState().connectToRoom('test-room', 'player-1');

    // Simulate receiving a move from opponent
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-0',
      targetPosition: { x: 100, y: 100 },
      playerId: 'player-2',
      timestamp: Date.now(),
    };

    // Trigger the move callbacks
    const callbacks = (networkManager as any).moveCallbacks;
    callbacks.forEach((cb: any) => cb(mockMoveData));

    // Assert: After fix, callback should execute exactly once
    expect(moveReceivedCount).toBe(1);
    expect(receiveNetworkMoveSpy).toHaveBeenCalledTimes(1);
    
    // Verify only 1 callback is registered
    expect(callbacks.length).toBe(1);
  });

  it('FIXED: Triple reconnection via store should handle events once', () => {
    // Arrange
    let moveReceivedCount = 0;
    const originalReceiveNetworkMove = useGameStore.getState().receiveNetworkMove;
    
    const receiveNetworkMoveSpy = vi.fn((moveData: NetworkMoveData) => {
      moveReceivedCount++;
      originalReceiveNetworkMove(moveData);
    });

    useGameStore.setState({ receiveNetworkMove: receiveNetworkMoveSpy });

    // Act: Connect 3 times with disconnects in between
    useGameStore.getState().connectToRoom('test-room', 'player-1');
    useGameStore.getState().disconnectFromRoom();
    
    useGameStore.getState().connectToRoom('test-room', 'player-1');
    useGameStore.getState().disconnectFromRoom();
    
    useGameStore.getState().connectToRoom('test-room', 'player-1');

    // Simulate network event
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-1',
      targetPosition: { x: 200, y: 200 },
      playerId: 'player-2',
      timestamp: Date.now(),
    };

    const callbacks = (networkManager as any).moveCallbacks;
    callbacks.forEach((cb: any) => cb(mockMoveData));

    // Assert: After fix, callback should execute exactly once
    expect(moveReceivedCount).toBe(1);
    expect(receiveNetworkMoveSpy).toHaveBeenCalledTimes(1);
    expect(callbacks.length).toBe(1);
  });

  it('FIXED: Role assignment callback should not duplicate on reconnection', () => {
    // Arrange: Track role changes directly

    // Act: Connect twice
    useGameStore.getState().connectToRoom('test-room', 'player-1');
    useGameStore.getState().disconnectFromRoom();
    
    useGameStore.getState().connectToRoom('test-room', 'player-1');

    // Simulate role assignment
    const callbacks = (networkManager as any).roleCallbacks;
    callbacks.forEach((cb: any) => cb(ChipType.CHASER));

    // Assert: After fix, only 1 callback should be registered
    expect(callbacks.length).toBe(1);
    
    // Verify role was set
    expect(useGameStore.getState().playerRole).toBe(ChipType.CHASER);
  });

  it('FIXED: Memory leak - callbacks should not accumulate over multiple reconnections', () => {
    // Arrange: Connect and disconnect 10 times
    const connectionCount = 10;

    // Act
    for (let i = 0; i < connectionCount; i++) {
      useGameStore.getState().connectToRoom(`test-room-${i}`, 'player-1');
      useGameStore.getState().disconnectFromRoom();
    }

    // Final connection
    useGameStore.getState().connectToRoom('test-room-final', 'player-1');

    // Assert: Check callback array sizes
    const moveCallbacks = (networkManager as any).moveCallbacks;
    const roleCallbacks = (networkManager as any).roleCallbacks;
    const connectionCallbacks = (networkManager as any).connectionCallbacks;

    // After fix: Only 1 callback of each type should be registered
    expect(moveCallbacks.length).toBe(1);
    expect(roleCallbacks.length).toBe(1);
    expect(connectionCallbacks.length).toBe(1);
  });

  it('EDGE CASE: First connection should work correctly (baseline)', () => {
    // Arrange
    let moveReceivedCount = 0;
    const originalReceiveNetworkMove = useGameStore.getState().receiveNetworkMove;
    
    const receiveNetworkMoveSpy = vi.fn((moveData: NetworkMoveData) => {
      moveReceivedCount++;
      originalReceiveNetworkMove(moveData);
    });

    useGameStore.setState({ receiveNetworkMove: receiveNetworkMoveSpy });

    // Act: Single connection (no reconnection)
    useGameStore.getState().connectToRoom('test-room-first', 'player-1');

    // Simulate network event
    const mockMoveData: NetworkMoveData = {
      chipId: 'runner-0',
      targetPosition: { x: 100, y: 100 },
      playerId: 'player-2',
      timestamp: Date.now(),
    };

    const callbacks = (networkManager as any).moveCallbacks;
    callbacks.forEach((cb: any) => cb(mockMoveData));

    // Assert: First connection should work correctly
    expect(moveReceivedCount).toBe(1);
    expect(receiveNetworkMoveSpy).toHaveBeenCalledTimes(1);
    expect(callbacks.length).toBe(1);
  });
});
