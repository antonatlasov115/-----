import React, { useEffect, useState } from 'react';

interface ScoreAnimationProps {
  points: number;
  color: string;
  onComplete: () => void;
}

export const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ points, color, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '96px',
          fontWeight: 'bold',
          color: color,
          textShadow: `
            0 0 30px ${color}, 
            0 0 60px ${color},
            0 0 90px ${color},
            0 4px 8px rgba(0,0,0,0.5)
          `,
          animation: 'scorePopup 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none',
          zIndex: 9999,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          WebkitTextStroke: '2px rgba(0,0,0,0.3)',
        }}
      >
        +{points}
      </div>
      
      {/* Particle effects */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            animation: `particle${i} 1.5s ease-out forwards`,
            pointerEvents: 'none',
            zIndex: 9998,
          }}
        />
      ))}
      
      <style>
        {`
          @keyframes scorePopup {
            0% {
              transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
              opacity: 0;
            }
            15% {
              transform: translate(-50%, -50%) scale(1.3) rotate(5deg);
              opacity: 1;
            }
            30% {
              transform: translate(-50%, -50%) scale(0.95) rotate(-2deg);
              opacity: 1;
            }
            45% {
              transform: translate(-50%, -50%) scale(1.05) rotate(1deg);
              opacity: 1;
            }
            70% {
              transform: translate(-50%, -60%) scale(1) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -80%) scale(0.8) rotate(0deg);
              opacity: 0;
            }
          }
          
          ${[...Array(12)].map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const distance = 150 + Math.random() * 50;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            return `
              @keyframes particle${i} {
                0% {
                  transform: translate(-50%, -50%) scale(1);
                  opacity: 1;
                }
                100% {
                  transform: translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) scale(0);
                  opacity: 0;
                }
              }
            `;
          }).join('\n')}
        `}
      </style>
    </>
  );
};
