import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * SMART COMPONENT - Online Multiplayer Lobby
 * 
 * Allows players to create or join online game rooms
 */

interface OnlineLobbyProps {
  onConnect: (roomId: string, playerId: string) => void;
  onCancel: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onConnect, onCancel }) => {
  const t = useTranslation();
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generatePlayerId = () => {
    return `player-${Math.random().toString(36).substring(2, 9)}`;
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    const newPlayerId = generatePlayerId();
    setRoomId(newRoomId);
    setPlayerId(newPlayerId);
    setIsCreatingRoom(true);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      alert(t('errors.enterRoomId'));
      return;
    }
    const newPlayerId = generatePlayerId();
    setPlayerId(newPlayerId);
    onConnect(roomId.toUpperCase(), newPlayerId);
  };

  const handleConnect = () => {
    if (!roomId.trim() || !playerId.trim()) {
      alert(t('errors.roomIdRequired'));
      return;
    }
    onConnect(roomId.toUpperCase(), playerId);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{t('onlineLobby.title')}</h2>

        {!isCreatingRoom ? (
          <>
            <div style={styles.section}>
              <button style={styles.primaryButton} onClick={handleCreateRoom}>
                {t('onlineLobby.createRoom')}
              </button>
            </div>

            <div style={styles.divider}>
              <span style={styles.dividerText}>{t('onlineLobby.or')}</span>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>{t('onlineLobby.joinRoom')}</label>
              <input
                type="text"
                placeholder={t('onlineLobby.roomIdPlaceholder')}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                style={styles.input}
                maxLength={6}
              />
              <button style={styles.primaryButton} onClick={handleJoinRoom}>
                {t('onlineLobby.joinButton')}
              </button>
            </div>
          </>
        ) : (
          <div style={styles.section}>
            <div style={styles.infoBox}>
              <p style={styles.infoLabel}>{t('onlineLobby.yourRoomId')}</p>
              <p style={styles.roomIdDisplay}>{roomId}</p>
              <p style={styles.infoText}>{t('onlineLobby.shareId')}</p>
            </div>

            <div style={styles.infoBox}>
              <p style={styles.infoLabel}>{t('onlineLobby.yourPlayerId')}</p>
              <p style={styles.playerIdDisplay}>{playerId}</p>
            </div>

            <button style={styles.primaryButton} onClick={handleConnect}>
              {t('onlineLobby.connectButton')}
            </button>
          </div>
        )}

        <button style={styles.cancelButton} onClick={onCancel}>
          {t('onlineLobby.cancel')}
        </button>

        <div style={styles.note}>
          <p style={styles.noteText}>
            {t('onlineLobby.note')}
          </p>
        </div>
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
    backgroundColor: 'rgba(74, 55, 40, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(135deg, #8B7355 0%, #6B5644 100%)',
    borderRadius: '12px',
    padding: '35px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '3px solid #4A3728',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '25px',
    textAlign: 'center',
    color: '#F5E6D3',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  section: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#D4A574',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  input: {
    width: '100%',
    padding: '14px',
    fontSize: '18px',
    border: '2px solid #4A3728',
    borderRadius: '6px',
    marginBottom: '15px',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: '3px',
    backgroundColor: '#F5E6D3',
    color: '#4A3728',
    transition: 'all 0.3s ease',
  },
  primaryButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    background: '#D4A574',
    color: '#4A3728',
    border: '2px solid #8B7355',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  cancelButton: {
    width: '100%',
    padding: '14px',
    fontSize: '14px',
    background: '#6B5644',
    color: '#D4A574',
    border: '2px solid #4A3728',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '15px',
    transition: 'all 0.3s ease',
  },
  divider: {
    textAlign: 'center',
    margin: '25px 0',
    position: 'relative',
  },
  dividerText: {
    backgroundColor: 'transparent',
    padding: '0 15px',
    color: '#D4A574',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoBox: {
    backgroundColor: 'rgba(245, 230, 211, 0.2)',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '2px solid #4A3728',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#D4A574',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  roomIdDisplay: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#F5E6D3',
    letterSpacing: '6px',
    margin: '12px 0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  playerIdDisplay: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#D4A574',
    fontFamily: 'monospace',
  },
  infoText: {
    fontSize: '12px',
    color: '#D4A574',
    marginTop: '8px',
  },
  note: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: 'rgba(233, 81, 0, 0.2)',
    borderRadius: '6px',
    border: '2px solid #E95100',
  },
  noteText: {
    fontSize: '12px',
    color: '#F5E6D3',
    margin: 0,
    textAlign: 'center',
  },
};
