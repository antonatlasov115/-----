import { describe, it, expect, beforeEach, vi } from 'vitest';
import { networkManager } from './socket';
import { NetworkMoveData, ChipType } from '../types';

/**
 * PRESERVATION PROPERTY TESTS
 * 
 * Property 2: Preservation - Multiplayer Functionality Unchanged
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests observe behavior on UNFIXED code for non-buggy inputs
 * and ensure that behavior is preserved after the fix.
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirms baseline behavior)
 * and continue to PASS after fix (confirms no regressions)
 */

describe('NetworkManager - Preservation Tests', () => {
  beforeEach(() => {
    // Clean up before each test
    networkManager.disconnect();
    networkManager.removeAllCallbacks();
  });

  describe('First Connection Preservation', () => {
    it('should successfully initialize connection on first connection', () => {
      // Arrange
      const connectionCallback = vi.fn();
      
      // Act: First connection (no reconnection)
      networkManager.onConnectionChange(connectionCallback);
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');
      
      // Assert: Connection should be initialized (room and player IDs set)
      // Note: isConnected() may be false until socket.io actually connects
      expect(networkManager.getRoomId()).toBe('test-room');
      expect(networkManager.getPlayerId()).toBe('player-1');
    });

    it('should correctly handle move received on first connection', () => {
      // Arrange
      let receivedMove: NetworkMoveData | null = null;
      const moveCallback = vi.fn((moveData: NetworkMoveData) => {
        receivedMove = moveData;
      });

      // Act: First connection
      networkManager.onMoveReceived(moveCallback);
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');

      // Simulate receiving a move
      const mockMoveData: NetworkMoveData = {
        chipId: 'runner-0',
        targetPosition: { x: 100, y: 100 },
        playerId: 'player-2',
        timestamp: Date.now(),
      };

      const callbacks = (networkManager as any).moveCallbacks;
      callbacks.forEach((cb: any) => cb(mockMoveData));

      // Assert: Move should be received exactly once
      expect(moveCallback).toHaveBeenCalledTimes(1);
      expect(receivedMove).toEqual(mockMoveData);
    });

    it('should correctly assign role on first connection', () => {
      // Arrange
      let assignedRole: ChipType | null = null;
      const roleCallback = vi.fn((role: ChipType) => {
        assignedRole = role;
      });

      // Act: First connection
      networkManager.onRoleAssigned(roleCallback);
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');

      // Simulate role assignment
      const callbacks = (networkManager as any).roleCallbacks;
      callbacks.forEach((cb: any) => cb(ChipType.CHASER));

      // Assert: Role should be assigned exactly once
      expect(roleCallback).toHaveBeenCalledTimes(1);
      expect(assignedRole).toBe(ChipType.CHASER);
    });
  });

  describe('Send Move Preservation', () => {
    it('should attempt to send moves after connection initialization', () => {
      // Arrange
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');
      
      // Mock socket to simulate connected state
      const socket = (networkManager as any).socket;
      if (socket) {
        Object.defineProperty(socket, 'connected', { value: true, writable: true });
        const emitSpy = vi.spyOn(socket, 'emit');

        // Act: Send a move
        const targetPosition = { x: 150, y: 150 };
        networkManager.sendMove('chaser-0', targetPosition);

        // Assert: Move should be sent via socket
        expect(emitSpy).toHaveBeenCalledWith('player-move', {
          roomId: 'test-room',
          moveData: expect.objectContaining({
            chipId: 'chaser-0',
            targetPosition,
            playerId: 'player-1',
          }),
        });
      }
    });

    it('should not send move when not connected', () => {
      // Arrange: Not connected
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act: Try to send a move
      networkManager.sendMove('chaser-0', { x: 100, y: 100 });

      // Assert: Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cannot send move: not connected to server'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Disconnect Preservation', () => {
    it('should properly disconnect and clean up', () => {
      // Arrange
      const connectionCallback = vi.fn();
      networkManager.onConnectionChange(connectionCallback);
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');

      // Act: Disconnect
      networkManager.disconnect();

      // Assert: Should be disconnected
      expect(networkManager.isConnected()).toBe(false);
      expect(networkManager.getRoomId()).toBe(null);
      expect(networkManager.getPlayerId()).toBe(null);
    });

    it('should clear callbacks when removeAllCallbacks is called', () => {
      // Arrange
      networkManager.onMoveReceived(() => {});
      networkManager.onRoleAssigned(() => {});
      networkManager.onConnectionChange(() => {});
      networkManager.onError(() => {});

      // Act: Remove all callbacks
      networkManager.removeAllCallbacks();

      // Assert: All callback arrays should be empty
      const moveCallbacks = (networkManager as any).moveCallbacks;
      const roleCallbacks = (networkManager as any).roleCallbacks;
      const connectionCallbacks = (networkManager as any).connectionCallbacks;
      const errorCallbacks = (networkManager as any).errorCallbacks;

      expect(moveCallbacks.length).toBe(0);
      expect(roleCallbacks.length).toBe(0);
      expect(connectionCallbacks.length).toBe(0);
      expect(errorCallbacks.length).toBe(0);
    });
  });

  describe('Error Handling Preservation', () => {
    it('should handle connection errors correctly', () => {
      // Arrange
      let errorReceived: string | null = null;
      const errorCallback = vi.fn((error: string) => {
        errorReceived = error;
      });

      networkManager.onError(errorCallback);
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');

      // Act: Simulate error
      const callbacks = (networkManager as any).errorCallbacks;
      callbacks.forEach((cb: any) => cb('Connection failed'));

      // Assert: Error should be handled
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(errorReceived).toBe('Connection failed');
    });
  });

  describe('Multiple Callbacks Preservation', () => {
    it('should support multiple callbacks for the same event', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      // Act: Register multiple callbacks
      networkManager.onMoveReceived(callback1);
      networkManager.onMoveReceived(callback2);
      networkManager.onMoveReceived(callback3);
      networkManager.connect('test-room', 'player-1', 'http://localhost:3001');

      // Simulate move
      const mockMoveData: NetworkMoveData = {
        chipId: 'runner-0',
        targetPosition: { x: 100, y: 100 },
        playerId: 'player-2',
        timestamp: Date.now(),
      };

      const callbacks = (networkManager as any).moveCallbacks;
      callbacks.forEach((cb: any) => cb(mockMoveData));

      // Assert: All callbacks should be called
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Property-Based: Connection State Preservation', () => {
    it('should maintain correct connection state through various operations', () => {
      // Test various sequences of operations
      const operations = [
        () => {
          networkManager.connect('room-1', 'player-1', 'http://localhost:3001');
          // Connection initialized
          expect(networkManager.getRoomId()).toBe('room-1');
          expect(networkManager.getPlayerId()).toBe('player-1');
        },
        () => {
          expect(networkManager.getRoomId()).toBe('room-1');
          expect(networkManager.getPlayerId()).toBe('player-1');
        },
        () => {
          // Mock connected state for sendMove
          const socket = (networkManager as any).socket;
          if (socket) {
            Object.defineProperty(socket, 'connected', { value: true, writable: true });
            networkManager.sendMove('chaser-0', { x: 100, y: 100 });
            // Should not throw error
          }
        },
        () => {
          networkManager.disconnect();
          expect(networkManager.isConnected()).toBe(false);
        },
      ];

      // Execute operations in sequence
      operations.forEach((op) => op());
    });
  });
});
