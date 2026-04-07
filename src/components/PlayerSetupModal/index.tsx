import React, { useState } from 'react';

interface PlayerSetupModalProps {
  onStart: (playerName: string) => void;
}

export const PlayerSetupModal: React.FC<PlayerSetupModalProps> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onStart(playerName.trim());
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Хабылык</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Ваше имя:
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Введите имя"
              style={styles.input}
              autoFocus
              maxLength={20}
            />
          </label>
          <button
            type="submit"
            disabled={!playerName.trim()}
            style={{
              ...styles.button,
              ...(playerName.trim() ? {} : styles.buttonDisabled),
            }}
          >
            Начать игру
          </button>
        </form>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(5px)',
  },
  modal: {
    background: 'linear-gradient(180deg, #8B7355 0%, #6B5644 100%)',
    padding: '40px',
    borderRadius: '12px',
    border: '4px solid #4A3728',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    maxWidth: '400px',
    width: '90%',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#F5E6D3',
    textAlign: 'center',
    marginBottom: '30px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    letterSpacing: '2px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#D4A574',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
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
    border: '3px solid #8B7355',
    borderRadius: '8px',
    outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
  },
  button: {
    padding: '14px',
    fontSize: '18px',
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
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
