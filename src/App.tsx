import React from 'react';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { ScoreAnimation } from './components/ScoreAnimation';
import { PlayerSetupModal } from './components/PlayerSetupModal';
import { GameOverModal } from './components/GameOverModal';
import { useGameStore } from './store/useGameStore';
import { GamePhase, ChipType, GameMode } from './types';
import './App.css';

/**
 * ROOT COMPONENT
 * 
 * Main application entry point
 * Orchestrates layout of game board and controls
 */

const App: React.FC = () => {
  const { 
    scoreAnimation, 
    clearScoreAnimation, 
    playerName, 
    setPlayerName,
    opponentName,
    phase,
    score,
    chips,
    playerRole,
    mode,
    resetGame,
    initializeGame,
  } = useGameStore();
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load player name from localStorage on mount
  React.useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, [setPlayerName]);

  const handlePlayerStart = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('playerName', name);
  };

  const getWinner = (): 'chaser' | 'runner' | 'draw' | null => {
    if (phase !== GamePhase.GAME_OVER) return null;
    
    // Check if all runners are captured
    const activeRunners = chips.filter(c => c.type === ChipType.RUNNER && c.isActive).length;
    if (activeRunners === 0) {
      return 'chaser';
    }
    
    // Otherwise compare scores
    if (score.chaser > score.runner) {
      return 'chaser';
    } else if (score.runner > score.chaser) {
      return 'runner';
    } else {
      return 'draw';
    }
  };

  const getChaserName = () => {
    if (mode === GameMode.ONLINE_MULTIPLAYER && opponentName) {
      return playerRole === ChipType.CHASER ? playerName || 'Игрок' : opponentName;
    }
    return playerName || 'Игрок';
  };

  const getRunnerName = () => {
    if (mode === GameMode.ONLINE_MULTIPLAYER && opponentName) {
      return playerRole === ChipType.RUNNER ? playerName || 'Игрок' : opponentName;
    }
    return 'Убегающие';
  };

  const handleRestart = () => {
    if (mode === GameMode.ONLINE_MULTIPLAYER) {
      initializeGame();
    } else {
      resetGame();
    }
  };

  // Show modal if player name is not set
  if (!playerName) {
    return <PlayerSetupModal onStart={handlePlayerStart} />;
  }

  const winner = getWinner();

  return (
    <div className="app-container">
      <div className={`app-sidebar ${!sidebarVisible ? 'hidden' : ''}`}>
        <GameControls />
      </div>
      <div className="app-game-area">
        <GameBoard />
        {isMobile && (
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 1000,
              padding: '12px 16px',
              fontSize: '20px',
              background: 'linear-gradient(180deg, #8B7355 0%, #6B5644 100%)',
              color: '#F5E6D3',
              border: '3px solid #4A3728',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              touchAction: 'manipulation',
            }}
          >
            {sidebarVisible ? '✕' : '☰'}
          </button>
        )}
      </div>
      {scoreAnimation && (
        <ScoreAnimation
          points={scoreAnimation.points}
          color={scoreAnimation.color}
          onComplete={clearScoreAnimation}
        />
      )}
      {winner && (
        <GameOverModal
          winner={winner}
          chaserScore={score.chaser}
          runnerScore={score.runner}
          chaserName={getChaserName()}
          runnerName={getRunnerName()}
          playerRole={playerRole}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default App;
