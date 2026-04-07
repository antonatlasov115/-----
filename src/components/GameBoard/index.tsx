import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import { useGameStore } from '../../store/useGameStore';
import { GAME_CONFIG } from '../../config/gameConfig';
import { Chip } from '../Chip';
import { PhantomChip } from '../PhantomChip';
import { ScoringLines } from '../ScoringLines';
import { useViewportSize } from '../../hooks/useViewportSize';

/**
 * SMART COMPONENT - Container
 * 
 * Connects UI to store and orchestrates rendering
 * Delegates all rendering to dumb components
 * Responsive: scales board to fit screen
 */

export const GameBoard: React.FC = () => {
  const {
    chips,
    phantomChip,
    selectChip,
    movePhantomChip,
    confirmMove,
    cancelMove,
  } = useGameStore();

  const viewport = useViewportSize({
    sidebarWidth: 300,
    mobileBreakpoint: 768,
    mobilePadding: 20,
    desktopPadding: 0,
  });

  const [boardImage, setBoardImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const stageRef = React.useRef<any>(null);

  // Calculate scale from viewport
  const scaleX = viewport.width / GAME_CONFIG.board.width;
  const scaleY = viewport.height / GAME_CONFIG.board.height;
  const scale = Math.min(scaleX, scaleY);

  console.log('Viewport:', { viewport, scaleX, scaleY, scale, boardSize: { width: GAME_CONFIG.board.width, height: GAME_CONFIG.board.height } });

  // Load board image
  useEffect(() => {
    const image = new window.Image();
    image.src = '/board.png';
    image.onload = () => {
      setBoardImage(image);
    };
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldZoom = zoom;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - dragPosition.x) / oldZoom,
      y: (pointer.y - dragPosition.y) / oldZoom,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    const newZoom = direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy;

    // Limit zoom range
    const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
    setZoom(clampedZoom);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedZoom,
      y: pointer.y - mousePointTo.y * clampedZoom,
    };

    setDragPosition(newPos);
  };

  const handleStageClick = (e: any) => {
    const targetName = e.target.name();
    
    // On mobile, don't auto-confirm on click - use button instead
    if (viewport.isMobile && phantomChip) {
      return;
    }
    
    // If clicking on empty space (background or stage) with phantom chip, confirm move
    if (phantomChip && (targetName === 'background' || e.target === e.target.getStage())) {
      // Update phantom position to click location before confirming
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      
      if (pointerPosition) {
        const adjustedX = (pointerPosition.x - dragPosition.x) / (scale * zoom);
        const adjustedY = (pointerPosition.y - dragPosition.y) / (scale * zoom);
        
        movePhantomChip({
          x: adjustedX,
          y: adjustedY,
        });
      }
      
      confirmMove();
      return;
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!phantomChip) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    if (pointerPosition) {
      const adjustedX = (pointerPosition.x - dragPosition.x) / (scale * zoom);
      const adjustedY = (pointerPosition.y - dragPosition.y) / (scale * zoom);
      
      movePhantomChip({
        x: adjustedX,
        y: adjustedY,
      });
    }
  };

  const handleStageTouchMove = (e: any) => {
    if (!phantomChip) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    if (pointerPosition) {
      const adjustedX = (pointerPosition.x - dragPosition.x) / (scale * zoom);
      const adjustedY = (pointerPosition.y - dragPosition.y) / (scale * zoom);
      
      movePhantomChip({
        x: adjustedX,
        y: adjustedY,
      });
    }
  };

  const handleStageRightClick = (e: any) => {
    e.evt.preventDefault();
    if (phantomChip) {
      cancelMove();
    }
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'visible',
      }}
    >
        <Stage
          ref={stageRef}
          width={viewport.width}
          height={viewport.height}
          scaleX={scale * zoom}
          scaleY={scale * zoom}
          x={dragPosition.x}
          y={dragPosition.y}
          draggable={!phantomChip}
          onDragEnd={(e) => {
            setDragPosition({ x: e.target.x(), y: e.target.y() });
          }}
          onClick={handleStageClick}
          onTap={handleStageClick}
          onMouseMove={handleStageMouseMove}
          onTouchMove={handleStageTouchMove}
          onContextMenu={handleStageRightClick}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
      {/* Background */}
      <Layer>
        {boardImage ? (
          <KonvaImage
            name="background"
            image={boardImage}
            x={0}
            y={0}
            width={GAME_CONFIG.board.width}
            height={GAME_CONFIG.board.height}
          />
        ) : (
          <Rect
            name="background"
            x={0}
            y={0}
            width={GAME_CONFIG.board.width}
            height={GAME_CONFIG.board.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: GAME_CONFIG.board.width, y: GAME_CONFIG.board.height }}
            fillLinearGradientColorStops={[
              0, '#E8DCC4',
              0.5, GAME_CONFIG.board.backgroundColor,
              1, '#D4C4A8',
            ]}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={15}
            shadowOffset={{ x: 0, y: 5 }}
          />
        )}
      </Layer>

      {/* Scoring Lines */}
      <ScoringLines />

      {/* Chips */}
      <Layer>
        {chips.map((chip) => (
          <Chip
            key={chip.id}
            chip={chip}
            onClick={selectChip}
          />
        ))}

        {/* Phantom Chip */}
        {phantomChip && <PhantomChip phantomChip={phantomChip} />}
      </Layer>
    </Stage>
      
      {/* Mobile control buttons */}
      {viewport.isMobile && phantomChip && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          zIndex: 1000,
        }}>
          <button
            onClick={confirmMove}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              border: '3px solid #2d6b2f',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              touchAction: 'manipulation',
            }}
          >
            ✓ Ход
          </button>
          <button
            onClick={cancelMove}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #f44336 0%, #da190b 100%)',
              color: 'white',
              border: '3px solid #8b0000',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              touchAction: 'manipulation',
            }}
          >
            ✕ Отмена
          </button>
        </div>
      )}
    </div>
  );
};
