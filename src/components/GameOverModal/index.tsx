import React from 'react';
import { ChipType } from '../../types';

interface GameOverModalProps {
  winner: 'chaser' | 'runner' | 'draw';
  chaserScore: number;
  runnerScore: number;
  chaserName: string;
  runnerName: string;
  playerRole: ChipType;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  chaserScore,
  runnerScore,
  chaserName,
  runnerName,
  playerRole,
  onRestart,
}) => {
  const isPlayerWinner = 
    (winner === 'chaser' && playerRole === ChipType.CHASER) ||
    (winner === 'runner' && playerRole === ChipType.RUNNER);

  const getTitle = () => {
    if (winner === 'draw') return '🤝 Ничья!';
    if (isPlayerWinner) return '🎉 Победа!';
    return '😔 Поражение';
  };

  const getWinnerText = () => {
    if (winner === 'draw') return 'Игра закончилась вничью';
    if (winner === 'chaser') return `${chaserName} победил!`;
    return `${runnerName} победили!`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{getTitle()}</h2>
        <p style={styles.winnerText}>{getWinnerText()}</p>
        
        <div style={styles.scoreContainer}>
          <div style={styles.scoreRow}>
            <span style={styles.playerLabel}>{chaserName}</span>
            <span style={{...styles.scoreValue, color: '#E95100'}}>{chaserScore}</span>
          </div>
          <div style={styles.scoreDivider}>—</div>
          <div style={styles.scoreRow}>
            <span style={styles.playerLabel}>{runnerName}</span>
            <span style={{...styles.scoreValue, color: '#4985DF'}}>{runnerScore}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          style={styles.button}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          Начать заново
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    background: 'linear-gradient(180deg, #8B7355 0%, #6B5644 100%)',
    padding: '50px 40px',
    borderRadius: '16px',
    border: '5px solid #4A3728',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
    animation: 'slideUp 0.4s ease',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#F5E6D3',
    marginBottom: '20px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    textShadow: '3px 3px 6px rgba(0,0,0,0.4)',
    letterSpacing: '2px',
  },
  winnerText: {
    fontSize: '24px',
    color: '#D4A574',
    marginBottom: '30px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 'bold',
  },
  scoreContainer: {
    background: 'rgba(74, 55, 40, 0.6)',
    padding: '30px',
    borderRadius: '12px',
    border: '3px solid #4A3728',
    marginBottom: '30px',
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  scoreDivider: {
    fontSize: '32px',
    color: '#8B7355',
    textAlign: 'center',
    margin: '10px 0',
  },
  playerLabel: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#F5E6D3',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
  },
  button: {
    width: '100%',
    padding: '18px',
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: "'Georgia', 'Times New Roman', serif",
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
    border: '3px solid #8B7355',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -1px 0 rgba(0,0,0,0.2),
      0 4px 8px rgba(0,0,0,0.3),
      0 0 0 1px rgba(139,115,85,0.3)
    `,
    textShadow: '0 1px 0 rgba(255,255,255,0.7)',
  },
};
