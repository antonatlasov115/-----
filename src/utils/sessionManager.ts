/**
 * Session persistence manager
 * Saves and restores online game session across page reloads
 */

interface GameSession {
  roomId: string;
  playerId: string;
  playerName: string;
  timestamp: number;
}

const SESSION_KEY = 'sonor_game_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const sessionManager = {
  /**
   * Save current game session
   */
  saveSession(roomId: string, playerId: string, playerName: string): void {
    const session: GameSession = {
      roomId,
      playerId,
      playerName,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  /**
   * Get saved session if valid
   */
  getSession(): GameSession | null {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (!data) return null;

      const session: GameSession = JSON.parse(data);

      // Check if session expired
      const age = Date.now() - session.timestamp;
      if (age > SESSION_TIMEOUT) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  },

  /**
   * Clear saved session
   */
  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  /**
   * Check if there's a valid session
   */
  hasSession(): boolean {
    return this.getSession() !== null;
  },
};
