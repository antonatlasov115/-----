import { io, Socket } from 'socket.io-client';
import { NetworkMoveData, Position, ChipType } from '../types';

/**
 * NETWORK MANAGER - Singleton Pattern
 * 
 * Handles all WebSocket communication for online multiplayer
 * Uses Socket.io for real-time bidirectional communication
 * 
 * Architecture: Store → NetworkManager → Socket.io Server
 */

type MoveCallback = (moveData: NetworkMoveData) => void;
type ConnectionCallback = (status: 'connected' | 'disconnected') => void;
type ErrorCallback = (error: string) => void;
type RoleCallback = (role: ChipType) => void;
type OpponentNameCallback = (name: string) => void;

class NetworkManager {
  private static instance: NetworkManager;
  private socket: Socket | null = null;
  private moveCallbacks: MoveCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private roleCallbacks: RoleCallback[] = [];
  private opponentNameCallbacks: OpponentNameCallback[] = [];
  private currentRoomId: string | null = null;
  private currentPlayerId: string | null = null;
  private currentPlayerName: string | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  /**
   * Connect to game server and join room
   * @param roomId Room identifier
   * @param playerId Player identifier
   * @param playerName Player display name
   * @param serverUrl Optional server URL (defaults to localhost:3001)
   */
  public connect(
    roomId: string,
    playerId: string,
    playerName: string,
    serverUrl: string = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
  ): void {
    // 1. STRICT CHECK: Prevent duplicate connections - early return if already connected
    if (this.socket?.connected) {
      console.warn('Already connected to server - skipping duplicate connection');
      return;
    }

    // 2. CLEANUP: If socket exists but not connected, clean it up first
    if (this.socket) {
      console.warn('Disconnecting previous socket session...');
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.currentRoomId = roomId;
    this.currentPlayerId = playerId;
    this.currentPlayerName = playerName;

    // Initialize socket connection
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Setup event listeners
    this.setupEventListeners();

    // Join room with player name
    this.socket.emit('join-room', { roomId, playerId, playerName });
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      // Clean up socket.io handlers before disconnecting
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.currentPlayerId = null;
      this.notifyConnectionCallbacks('disconnected');
    }
  }

  /**
   * Send move to opponent
   * @param chipId ID of chip being moved
   * @param targetPosition Target position
   */
  public sendMove(chipId: string, targetPosition: Position): void {
    if (!this.socket?.connected) {
      console.error('Cannot send move: not connected to server');
      return;
    }

    if (!this.currentRoomId || !this.currentPlayerId) {
      console.error('Cannot send move: missing room or player ID');
      return;
    }

    const moveData: NetworkMoveData = {
      chipId,
      targetPosition,
      playerId: this.currentPlayerId,
      timestamp: Date.now(),
    };

    this.socket.emit('player-move', {
      roomId: this.currentRoomId,
      moveData,
    });
  }

  /**
   * Register callback for when opponent makes a move
   * @param callback Function to call when move is received
   */
  public onMoveReceived(callback: MoveCallback): void {
    this.moveCallbacks.push(callback);
  }

  /**
   * Register callback for connection status changes
   * @param callback Function to call on connection change
   */
  public onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Register callback for errors
   * @param callback Function to call on error
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Register callback for role assignment
   * @param callback Function to call when role is assigned
   */
  public onRoleAssigned(callback: RoleCallback): void {
    this.roleCallbacks.push(callback);
  }

  /**
   * Register callback for opponent name
   * @param callback Function to call when opponent name is received
   */
  public onOpponentName(callback: OpponentNameCallback): void {
    this.opponentNameCallbacks.push(callback);
  }

  /**
   * Remove all callbacks (cleanup)
   */
  public removeAllCallbacks(): void {
    this.moveCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
    this.roleCallbacks = [];
    this.opponentNameCallbacks = [];
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current room ID
   */
  public getRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Get current player ID
   */
  public getPlayerId(): string | null {
    return this.currentPlayerId;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // GUARD: Remove all old socket.io handlers before registering new ones
    // This prevents handler duplication on reconnection
    this.socket.removeAllListeners();

    // Connection established
    this.socket.on('connect', () => {
      console.log('Connected to game server');
      this.notifyConnectionCallbacks('connected');

      // Auto-rejoin room on reconnect
      if (this.currentRoomId && this.currentPlayerId && this.currentPlayerName) {
        console.log('Reconnecting to room:', this.currentRoomId);
        this.socket?.emit('join-room', {
          roomId: this.currentRoomId,
          playerId: this.currentPlayerId,
          playerName: this.currentPlayerName
        });
      }
    });

    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from game server:', reason);
      this.notifyConnectionCallbacks('disconnected');
    });

    // Reconnecting
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
    });

    // Reconnected successfully
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
    });

    // Opponent made a move
    this.socket.on('opponent-move', (moveData: NetworkMoveData) => {
      console.log('Received opponent move:', moveData);
      this.notifyMoveCallbacks(moveData);
    });

    // Room joined successfully
    this.socket.on('room-joined', (data: { roomId: string; playerId: string; role: string; opponentName?: string }) => {
      console.log('Successfully joined room:', data);
      console.log('Role received from server:', data.role);
      console.log('Role type:', typeof data.role);
      // Notify role callbacks
      if (data.role === 'CHASER' || data.role === 'RUNNER') {
        const chipTypeRole = data.role as ChipType;
        console.log('Notifying role callbacks with:', chipTypeRole);
        this.notifyRoleCallbacks(chipTypeRole);
      } else {
        console.error('Invalid role received:', data.role);
      }
      // Notify opponent name if available
      if (data.opponentName) {
        this.notifyOpponentNameCallbacks(data.opponentName);
      }
    });

    // Player joined room
    this.socket.on('player-joined', (data: { playerId: string; playerName: string; role: string }) => {
      console.log('Player joined room:', data);
      // Notify opponent name
      this.notifyOpponentNameCallbacks(data.playerName);
    });

    // Error occurred
    this.socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      this.notifyErrorCallbacks(error);
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error.message);
      this.notifyErrorCallbacks(error.message);
    });
  }

  /**
   * Notify all move callbacks
   */
  private notifyMoveCallbacks(moveData: NetworkMoveData): void {
    this.moveCallbacks.forEach((callback) => callback(moveData));
  }

  /**
   * Notify all connection callbacks
   */
  private notifyConnectionCallbacks(status: 'connected' | 'disconnected'): void {
    this.connectionCallbacks.forEach((callback) => callback(status));
  }

  /**
   * Notify all error callbacks
   */
  private notifyErrorCallbacks(error: string): void {
    this.errorCallbacks.forEach((callback) => callback(error));
  }

  /**
   * Notify all role callbacks
   */
  private notifyRoleCallbacks(role: ChipType): void {
    this.roleCallbacks.forEach((callback) => callback(role));
  }

  /**
   * Notify all opponent name callbacks
   */
  private notifyOpponentNameCallbacks(name: string): void {
    this.opponentNameCallbacks.forEach((callback) => callback(name));
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();
