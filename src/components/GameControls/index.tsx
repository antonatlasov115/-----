import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { GamePhase, GameMode, ChipType } from '../../types';
import { OnlineLobby } from '../OnlineLobby';
import { useTranslation } from '../../hooks/useTranslation';
import { useLocale, Locale } from '../../contexts/LocaleContext';
import './GameControls.css';

/**
 * SMART COMPONENT - Game Controls
 * 
 * Displays game state and provides controls
 * Connected to store for state and actions
 */

export const GameControls: React.FC = () => {
  const t = useTranslation();
  const { locale, setLocale } = useLocale();
  const {
    phase,
    score,
    turn,
    mode,
    playerRole,
    networkStatus,
    roomId,
    playerName,
    opponentName,
    soundEnabled,
    resetGame,
    initializeGame,
    executeAITurn,
    setGameMode,
    setPlayerRole,
    connectToRoom,
    disconnectFromRoom,
    toggleSound,
  } = useGameStore();

  const [showOnlineLobby, setShowOnlineLobby] = useState(false);

  React.useEffect(() => {
    initializeGame();
  }, []); // Empty dependency array - run only once on mount

  // Auto-execute AI turn with delay
  React.useEffect(() => {
    if (mode !== GameMode.SINGLE_PLAYER) return;

    const isAITurn =
      (phase === GamePhase.CHASER_TURN && playerRole === ChipType.RUNNER) ||
      (phase === GamePhase.RUNNER_TURN && playerRole === ChipType.CHASER);

    if (isAITurn) {
      const timeoutId = setTimeout(() => {
        executeAITurn();
      }, 500); // 500ms delay for AI move

      return () => clearTimeout(timeoutId);
    }
  }, [phase, mode, playerRole, executeAITurn]);

  const getPhaseText = () => {
    switch (phase) {
      case GamePhase.CHASER_TURN:
        return t('gamePhase.chaserTurn');
      case GamePhase.RUNNER_TURN:
        return t('gamePhase.runnerTurn');
      case GamePhase.CHASER_SELECTING:
        return t('gamePhase.chaserSelecting');
      case GamePhase.RUNNER_SELECTING:
        return t('gamePhase.runnerSelecting');
      case GamePhase.GAME_OVER:
        return t('gamePhase.gameOver');
      default:
        return t('gamePhase.idle');
    }
  };

  const handleOnlineClick = () => {
    setShowOnlineLobby(true);
  };

  const handleOnlineConnect = (roomId: string, playerId: string) => {
    setGameMode(GameMode.ONLINE_MULTIPLAYER);
    connectToRoom(roomId, playerId);
    setShowOnlineLobby(false);
  };

  const handleOnlineDisconnect = () => {
    disconnectFromRoom();
  };

  const getNetworkStatusText = () => {
    switch (networkStatus) {
      case 'connected':
        return `🟢 ${t('network.connected')}`;
      case 'connecting':
        return `🟡 ${t('network.connecting')}`;
      case 'disconnected':
        return `🔴 ${t('network.disconnected')}`;
      default:
        return '';
    }
  };

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <div style={styles.container} className="game-controls-container">
      <div style={styles.header}>
        <h1 style={styles.title} className="game-controls-title">{t('app.title')}</h1>
        {playerName && (
          <div style={styles.playerNameDisplay}>
            👤 {playerName}
          </div>
        )}
        <div style={styles.languageSelector}>
          <button
            style={{
              ...styles.langButton,
              ...(locale === 'ru' ? styles.langButtonActive : {}),
            }}
            className="game-controls-lang-button"
            onClick={() => handleLanguageChange('ru')}
            onMouseEnter={(e) => {
              if (locale !== 'ru') {
                e.currentTarget.style.filter = 'brightness(0.95)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (locale !== 'ru') {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            РУС
          </button>
          <button
            style={{
              ...styles.langButton,
              ...(locale === 'en' ? styles.langButtonActive : {}),
            }}
            className="game-controls-lang-button"
            onClick={() => handleLanguageChange('en')}
            onMouseEnter={(e) => {
              if (locale !== 'en') {
                e.currentTarget.style.filter = 'brightness(0.95)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (locale !== 'en') {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            ENG
          </button>
          <button
            style={{
              ...styles.langButton,
              ...(locale === 'sah' ? styles.langButtonActive : {}),
            }}
            className="game-controls-lang-button"
            onClick={() => handleLanguageChange('sah')}
            onMouseEnter={(e) => {
              if (locale !== 'sah') {
                e.currentTarget.style.filter = 'brightness(0.95)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (locale !== 'sah') {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            САХ
          </button>
          <button
            style={{
              ...styles.langButton,
              ...(soundEnabled ? styles.langButtonActive : {}),
            }}
            className="game-controls-lang-button"
            onClick={toggleSound}
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0.95)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* Game Mode Selection */}
      <div style={styles.section} className="game-controls-section">
        <h3 style={styles.sectionTitle} className="game-controls-section-title">{t('gameMode.title')}</h3>
        <div style={styles.buttonGroup} className="game-controls-button-group">
          <button
            style={{
              ...styles.modeButton,
              ...(mode === GameMode.SINGLE_PLAYER ? styles.modeButtonActive : {}),
              ...(mode === GameMode.ONLINE_MULTIPLAYER && networkStatus === 'connected' ? styles.modeButtonDisabled : {}),
            }}
            className="game-controls-mode-button"
            onClick={() => setGameMode(GameMode.SINGLE_PLAYER)}
            disabled={mode === GameMode.ONLINE_MULTIPLAYER && networkStatus === 'connected'}
          >
            {t('gameMode.singlePlayer')}
          </button>
          <button
            style={{
              ...styles.modeButton,
              ...(mode === GameMode.HOTSEAT ? styles.modeButtonActive : {}),
              ...(mode === GameMode.ONLINE_MULTIPLAYER && networkStatus === 'connected' ? styles.modeButtonDisabled : {}),
            }}
            className="game-controls-mode-button"
            onClick={() => setGameMode(GameMode.HOTSEAT)}
            disabled={mode === GameMode.ONLINE_MULTIPLAYER && networkStatus === 'connected'}
          >
            {t('gameMode.hotseat')}
          </button>
        </div>
        <button
          style={{
            ...styles.onlineButton,
            ...(mode === GameMode.ONLINE_MULTIPLAYER ? styles.onlineButtonActive : {}),
          }}
          onClick={mode === GameMode.ONLINE_MULTIPLAYER ? handleOnlineDisconnect : handleOnlineClick}
        >
          {mode === GameMode.ONLINE_MULTIPLAYER ? t('gameMode.disconnect') : t('gameMode.onlineMultiplayer')}
        </button>
        {mode === GameMode.ONLINE_MULTIPLAYER && (
          <div style={styles.networkStatus}>
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>{t('network.status')}:</span>
              <span style={styles.statusValue}>{getNetworkStatusText()}</span>
            </div>
            {roomId && (
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>{t('network.room')}:</span>
                <span style={styles.statusValue}>{roomId}</span>
              </div>
            )}
            {networkStatus === 'connected' && (
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>{t('network.yourRole')}:</span>
                <span style={styles.statusValue}>
                  {playerRole === ChipType.CHASER ? t('network.chaserRole') : t('network.runnerRole')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Role Selection (only in single player) */}
      {mode === GameMode.SINGLE_PLAYER && (
        <div style={styles.section} className="game-controls-section">
          <h3 style={styles.sectionTitle} className="game-controls-section-title">{t('playerRole.title')}</h3>
          <div style={styles.buttonGroup} className="game-controls-button-group">
            <button
              style={{
                ...styles.modeButton,
                ...(playerRole === ChipType.RUNNER ? styles.modeButtonActive : {}),
              }}
              className="game-controls-mode-button"
              onClick={() => setPlayerRole(ChipType.RUNNER)}
            >
              {t('playerRole.runner')}
            </button>
            <button
              style={{
                ...styles.modeButton,
                ...(playerRole === ChipType.CHASER ? styles.modeButtonActive : {}),
              }}
              className="game-controls-mode-button"
              onClick={() => setPlayerRole(ChipType.CHASER)}
            >
              {t('playerRole.chaser')}
            </button>
          </div>
        </div>
      )}

      <div style={styles.info}>
        <div style={styles.infoRow}>
          <span style={styles.label}>{t('gameInfo.turn')}:</span>
          <span style={styles.value}>{turn}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.label}>{t('gameInfo.phase')}:</span>
          <span style={styles.value}>{getPhaseText()}</span>
        </div>
      </div>

      <div style={styles.scoreBoard} className="game-controls-score-board">
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel} className="game-controls-score-label">
            {mode === GameMode.ONLINE_MULTIPLAYER && opponentName
              ? (playerRole === ChipType.CHASER ? `${playerName}` : opponentName)
              : (playerRole === ChipType.CHASER ? `${playerName}` : t('score.chaser'))}
          </span>
          <span style={{...styles.scoreValue, color: '#E95100'}} className="game-controls-score-value">{score.chaser}</span>
        </div>
        <div style={styles.scoreItem}>
          <span style={styles.scoreLabel} className="game-controls-score-label">
            {mode === GameMode.ONLINE_MULTIPLAYER && opponentName
              ? (playerRole === ChipType.RUNNER ? `${playerName}` : opponentName)
              : (playerRole === ChipType.RUNNER ? `${playerName}` : t('score.runner'))}
          </span>
          <span style={{...styles.scoreValue, color: '#4985DF'}} className="game-controls-score-value">{score.runner}</span>
        </div>
      </div>

      <div style={styles.controls}>
        <button 
          style={styles.button} 
          onClick={resetGame}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03) translateY(-1px)';
            e.currentTarget.style.filter = 'brightness(1.05)';
            e.currentTarget.style.boxShadow = `
              inset 0 1px 0 rgba(255,255,255,0.7),
              inset 0 -1px 0 rgba(0,0,0,0.25),
              0 4px 8px rgba(0,0,0,0.25),
              0 0 0 1px rgba(139,115,85,0.4)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.boxShadow = `
              inset 0 1px 0 rgba(255,255,255,0.6),
              inset 0 -1px 0 rgba(0,0,0,0.2),
              0 3px 6px rgba(0,0,0,0.2),
              0 0 0 1px rgba(139,115,85,0.3)
            `;
          }}
        >
          {t('controls.resetGame')}
        </button>
      </div>

      {showOnlineLobby && (
        <OnlineLobby
          onConnect={handleOnlineConnect}
          onCancel={() => setShowOnlineLobby(false)}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    maxWidth: '400px',
    color: '#F5E6D3',
  },
  header: {
    marginBottom: '25px',
    textAlign: 'center',
    borderBottom: '2px solid #D4A574',
    paddingBottom: '15px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '15px',
    color: '#F5E6D3',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '2px',
  },
  playerNameDisplay: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#D4A574',
    textAlign: 'center',
    marginBottom: '15px',
    padding: '8px 16px',
    background: 'rgba(74, 55, 40, 0.5)',
    borderRadius: '6px',
    border: '2px solid #4A3728',
  },
  languageSelector: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  langButton: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 'bold',
    background: `
      linear-gradient(180deg, 
        #FFF8E7 0%, 
        #F5E6D3 8%,
        #EDD9C0 16%,
        #F5E6D3 24%,
        #EDD9C0 32%,
        #E8D5B8 50%,
        #EDD9C0 68%,
        #F5E6D3 76%,
        #EDD9C0 84%,
        #E8D5B8 92%,
        #D4C4A8 100%
      )
    `,
    color: '#3D2F1F',
    border: '2px solid #8B7355',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 2px 4px rgba(0,0,0,0.2),
      0 0 0 1px rgba(139,115,85,0.3)
    `,
    textShadow: '0 1px 0 rgba(255,255,255,0.7)',
    position: 'relative',
    overflow: 'hidden',
  },
  langButtonActive: {
    background: `
      linear-gradient(180deg, 
        #E8D5B8 0%, 
        #D4A574 8%,
        #C89860 16%,
        #D4A574 24%,
        #C89860 32%,
        #B8885A 50%,
        #C89860 68%,
        #D4A574 76%,
        #C89860 84%,
        #B8885A 92%,
        #A67C52 100%
      )
    `,
    color: '#2A1F15',
    border: '2px solid #8B6F47',
    boxShadow: `
      inset 0 2px 4px rgba(0,0,0,0.3),
      inset 0 -1px 0 rgba(255,255,255,0.2),
      0 1px 2px rgba(0,0,0,0.3),
      0 0 0 1px rgba(139,111,71,0.4)
    `,
    textShadow: '0 1px 1px rgba(0,0,0,0.4)',
  },
  section: {
    marginBottom: '25px',
    padding: '15px',
    backgroundColor: 'rgba(107, 86, 68, 0.3)',
    borderRadius: '8px',
    border: '2px solid #4A3728',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#D4A574',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    lineHeight: '1.4',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  modeButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    background: `
      linear-gradient(180deg, 
        #FFF8E7 0%, 
        #F5E6D3 5%,
        #EDD9C0 10%,
        #F5E6D3 15%,
        #EDD9C0 20%,
        #E8D5B8 25%,
        #EDD9C0 30%,
        #F5E6D3 35%,
        #EDD9C0 40%,
        #E8D5B8 50%,
        #EDD9C0 60%,
        #F5E6D3 65%,
        #EDD9C0 70%,
        #E8D5B8 75%,
        #EDD9C0 80%,
        #F5E6D3 85%,
        #EDD9C0 90%,
        #E8D5B8 95%,
        #D4C4A8 100%
      )
    `,
    color: '#3D2F1F',
    border: '2px solid #8B7355',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 2px 4px rgba(0,0,0,0.2),
      0 0 0 1px rgba(139,115,85,0.3)
    `,
    textShadow: '0 1px 0 rgba(255,255,255,0.7)',
    position: 'relative',
    overflow: 'hidden',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    lineHeight: '1.3',
    minHeight: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    background: `
      linear-gradient(180deg,
        #E8D5B8 0%,
        #D4A574 5%,
        #C89860 10%,
        #D4A574 15%,
        #C89860 20%,
        #B8885A 25%,
        #C89860 30%,
        #D4A574 35%,
        #C89860 40%,
        #B8885A 50%,
        #C89860 60%,
        #D4A574 65%,
        #C89860 70%,
        #B8885A 75%,
        #C89860 80%,
        #D4A574 85%,
        #C89860 90%,
        #B8885A 95%,
        #A67C52 100%
      )
    `,
    color: '#2A1F15',
    border: '2px solid #8B6F47',
    transform: 'scale(1.02)',
    boxShadow: `
      inset 0 2px 4px rgba(0,0,0,0.3),
      inset 0 -1px 0 rgba(255,255,255,0.2),
      0 1px 2px rgba(0,0,0,0.3),
      0 0 0 1px rgba(139,111,71,0.4)
    `,
    textShadow: '0 1px 1px rgba(0,0,0,0.4)',
  },
  modeButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  info: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'rgba(107, 86, 68, 0.3)',
    borderRadius: '8px',
    border: '2px solid #4A3728',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold',
    color: '#D4A574',
  },
  value: {
    color: '#F5E6D3',
  },
  scoreBoard: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '25px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(107, 86, 68, 0.5) 0%, rgba(74, 55, 40, 0.5) 100%)',
    borderRadius: '8px',
    border: '3px solid #4A3728',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#D4A574',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    textAlign: 'center',
    maxWidth: '120px',
  },
  scoreValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
  },
  controls: {
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    background: `
      linear-gradient(180deg, 
        #FFF8E7 0%, 
        #F5E6D3 5%,
        #EDD9C0 10%,
        #F5E6D3 15%,
        #EDD9C0 20%,
        #E8D5B8 25%,
        #EDD9C0 30%,
        #F5E6D3 35%,
        #EDD9C0 40%,
        #E8D5B8 50%,
        #EDD9C0 60%,
        #F5E6D3 65%,
        #EDD9C0 70%,
        #E8D5B8 75%,
        #EDD9C0 80%,
        #F5E6D3 85%,
        #EDD9C0 90%,
        #E8D5B8 95%,
        #D4C4A8 100%
      )
    `,
    color: '#3D2F1F',
    border: '2px solid #8B7355',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 3px 6px rgba(0,0,0,0.2),
      0 0 0 1px rgba(139,115,85,0.3)
    `,
    textShadow: '0 1px 0 rgba(255,255,255,0.7)',
    position: 'relative',
    overflow: 'hidden',
  },
  gameOver: {
    padding: '25px',
    background: 'rgba(233, 81, 0, 0.2)',
    borderRadius: '8px',
    textAlign: 'center',
    border: '3px solid #E95100',
    color: '#F5E6D3',
  },
  onlineButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    background: `
      linear-gradient(180deg, 
        #FFF8E7 0%, 
        #F5E6D3 5%,
        #EDD9C0 10%,
        #F5E6D3 15%,
        #EDD9C0 20%,
        #E8D5B8 25%,
        #EDD9C0 30%,
        #F5E6D3 35%,
        #EDD9C0 40%,
        #E8D5B8 50%,
        #EDD9C0 60%,
        #F5E6D3 65%,
        #EDD9C0 70%,
        #E8D5B8 75%,
        #EDD9C0 80%,
        #F5E6D3 85%,
        #EDD9C0 90%,
        #E8D5B8 95%,
        #D4C4A8 100%
      )
    `,
    color: '#3D2F1F',
    border: '2px solid #8B7355',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.3s ease',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 2px 4px rgba(0,0,0,0.2),
      0 0 0 1px rgba(139,115,85,0.3)
    `,
    textShadow: '0 1px 0 rgba(255,255,255,0.7)',
    position: 'relative',
    overflow: 'hidden',
  },
  onlineButtonActive: {
    background: `
      linear-gradient(180deg, 
        #FF6B1A 0%, 
        #E95100 8%,
        #D44800 16%,
        #E95100 24%,
        #D44800 32%,
        #C03F00 50%,
        #D44800 68%,
        #E95100 76%,
        #D44800 84%,
        #C03F00 92%,
        #A03300 100%
      )
    `,
    color: '#FFF5E6',
    border: '2px solid #812F04',
    boxShadow: `
      inset 0 2px 4px rgba(0,0,0,0.4),
      inset 0 -1px 0 rgba(255,255,255,0.2),
      0 1px 2px rgba(0,0,0,0.4),
      0 0 0 1px rgba(129,47,4,0.5)
    `,
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
  },
  networkStatus: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: 'rgba(74, 55, 40, 0.5)',
    borderRadius: '6px',
    fontSize: '12px',
    border: '1px solid #4A3728',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  statusLabel: {
    fontWeight: 'bold',
    color: '#D4A574',
  },
  statusValue: {
    color: '#F5E6D3',
  },
};
