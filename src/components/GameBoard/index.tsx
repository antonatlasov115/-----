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
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);

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
      x: (pointer.x - dragPosition.x) / (scale * oldZoom),
      y: (pointer.y - dragPosition.y) / (scale * oldZoom),
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    const newZoom = direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy;

    // Limit zoom range
    const clampedZoom = Math.max(0.5, Math.min(5, newZoom));
    setZoom(clampedZoom);

    const newPos = {
      x: pointer.x - mousePointTo.x * scale * clampedZoom,
      y: pointer.y - mousePointTo.y * scale * clampedZoom,
    };

    setDragPosition(newPos);
  };

  // Get distance between two touch points
  const getTouchDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle pinch-to-zoom
  const handleTouchMove = (e: any) => {
    const evt = e.evt;

    if (evt.touches.length === 2) {
      // Pinch zoom - only when no phantom chip
      if (phantomChip) return;

      evt.preventDefault();

      const touch1 = evt.touches[0];
      const touch2 = evt.touches[1];
      const distance = getTouchDistance(touch1, touch2);

      if (lastTouchDistance !== null) {
        const stage = stageRef.current;
        if (!stage) return;

        const oldZoom = zoom;
        const scaleChange = distance / lastTouchDistance;
        const newZoom = oldZoom * scaleChange;

        // Limit zoom range
        const clampedZoom = Math.max(0.5, Math.min(5, newZoom));
        setZoom(clampedZoom);

        // Center zoom between two fingers
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;

        const mousePointTo = {
          x: (centerX - dragPosition.x) / (scale * oldZoom),
          y: (centerY - dragPosition.y) / (scale * oldZoom),
        };

        const newPos = {
          x: centerX - mousePointTo.x * scale * clampedZoom,
          y: centerY - mousePointTo.y * scale * clampedZoom,
        };

        setDragPosition(newPos);
      }

      setLastTouchDistance(distance);
    } else if (phantomChip && evt.touches.length === 1) {
      // Move phantom chip
      handleStageTouchMove(e);
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  // Handle double tap to zoom
  const handleDoubleTap = () => {
    // Don't zoom if phantom chip is active
    if (phantomChip) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTap;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      const oldZoom = zoom;
      const newZoom = oldZoom === 1 ? 2 : 1;

      setZoom(newZoom);

      if (newZoom > oldZoom) {
        // Zoom in to tap point
        const mousePointTo = {
          x: (pointer.x - dragPosition.x) / (scale * oldZoom),
          y: (pointer.y - dragPosition.y) / (scale * oldZoom),
        };

        const newPos = {
          x: pointer.x - mousePointTo.x * scale * newZoom,
          y: pointer.y - mousePointTo.y * scale * newZoom,
        };

        setDragPosition(newPos);
      } else {
        // Reset position when zooming out
        setDragPosition({ x: 0, y: 0 });
      }
    }

    setLastTap(now);
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newZoom = Math.min(5, zoom * 1.3);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.5, zoom / 1.3);
    setZoom(newZoom);
  };

  const handleZoomReset = () => {
    setZoom(1);
    setDragPosition({ x: 0, y: 0 });
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
          onTap={handleDoubleTap}
          onMouseMove={handleStageMouseMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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

      {/* Zoom controls */}
      {viewport.isMobile && (
        <div style={{
          position: 'absolute',
          bottom: phantomChip ? '150px' : '100px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000,
          transition: 'bottom 0.3s ease',
        }}>
          <button
            onClick={handleZoomIn}
            style={{
              width: '50px',
              height: '50px',
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #8B7355 0%, #6B5644 100%)',
              color: '#F5E6D3',
              border: '3px solid #4A3728',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: '50px',
              height: '50px',
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #8B7355 0%, #6B5644 100%)',
              color: '#F5E6D3',
              border: '3px solid #4A3728',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <button
            onClick={handleZoomReset}
            style={{
              width: '50px',
              height: '50px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #8B7355 0%, #6B5644 100%)',
              color: '#F5E6D3',
              border: '3px solid #4A3728',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⊙
          </button>
        </div>
      )}

      {/* Mobile control buttons */}
      {viewport.isMobile && phantomChip && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
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
