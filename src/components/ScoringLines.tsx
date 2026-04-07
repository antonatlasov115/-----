import React from 'react';
import { Layer, Line } from 'react-konva';
import { GAME_CONFIG } from '../config/gameConfig';

/**
 * DUMB COMPONENT - Pure Presentation
 * 
 * Renders scoring lines on the board
 * No logic - only displays lines from config
 */

export const ScoringLines: React.FC = () => {
  return (
    <Layer>
      {GAME_CONFIG.scoringLines.y.map((y, index) => (
        <Line
          key={`scoring-line-${index}`}
          points={[0, y, GAME_CONFIG.board.width, y]}
          stroke={GAME_CONFIG.scoringLines.color}
          strokeWidth={GAME_CONFIG.scoringLines.strokeWidth}
          listening={false}
        />
      ))}
    </Layer>
  );
};
