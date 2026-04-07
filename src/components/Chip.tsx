import React, { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Chip as ChipType } from '../types';

/**
 * DUMB COMPONENT - Pure Presentation with SVG Icons
 * 
 * Renders a single chip using SVG images from public folder
 */

interface ChipProps {
  chip: ChipType;
  onClick?: (chipId: string) => void;
  isSelected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ chip, onClick, isSelected = false }) => {
  const imageRef = useRef<Konva.Image>(null);
  const prevPositionRef = useRef(chip.position);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load SVG image based on chip type
  useEffect(() => {
    const img = new window.Image();
    img.src = chip.type === 'CHASER' ? '/predator.svg' : '/runner.svg';
    img.onload = () => {
      setImage(img);
    };
  }, [chip.type]);

  // Animate position changes smoothly with bounce effect
  useEffect(() => {
    const imageNode = imageRef.current;
    if (!imageNode) return;

    const prevPos = prevPositionRef.current;
    const newPos = chip.position;

    // Only animate if position actually changed
    if (prevPos.x !== newPos.x || prevPos.y !== newPos.y) {
      // Calculate angle for slight rotation during movement
      const dx = newPos.x - prevPos.x;
      const dy = newPos.y - prevPos.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const rotationAmount = 15; // degrees
      
      // Animate with bounce and rotation
      imageNode.to({
        x: newPos.x - chip.radius,
        y: newPos.y - chip.radius,
        rotation: angle > 0 ? rotationAmount : -rotationAmount,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 0.15,
        easing: Konva.Easings.EaseOut,
        onFinish: () => {
          // Return to normal state
          imageNode.to({
            rotation: 0,
            scaleX: isSelected ? 1.15 : 1,
            scaleY: isSelected ? 1.15 : 1,
            duration: 0.15,
            easing: Konva.Easings.EaseIn,
          });
        },
      });

      prevPositionRef.current = newPos;
    }
  }, [chip.position, chip.radius, isSelected]);

  // Selection/hover effects with pulsing animation
  const scale = isSelected ? 1.15 : 1;
  const shadowBlur = isSelected ? 25 : 12;

  // Add pulsing effect for selected chip
  useEffect(() => {
    const imageNode = imageRef.current;
    if (!imageNode || !isSelected) return;

    const pulseAnimation = new Konva.Animation((frame) => {
      if (!frame) return;
      const period = 1000; // 1 second
      const scale = 1.15 + Math.sin((frame.time * 2 * Math.PI) / period) * 0.05;
      imageNode.scaleX(scale);
      imageNode.scaleY(scale);
    }, imageNode.getLayer());

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [isSelected]);

  // Animate capture effect
  useEffect(() => {
    const imageNode = imageRef.current;
    if (!imageNode) return;

    if (chip.isCaptured) {
      // Spin and fade out when captured
      imageNode.to({
        opacity: 0,
        rotation: 360,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 0.5,
        easing: Konva.Easings.EaseIn,
      });
    }
  }, [chip.isCaptured]);

  if (!image) return null;

  return (
    <KonvaImage
      ref={imageRef}
      image={image}
      x={chip.position.x - chip.radius}
      y={chip.position.y - chip.radius}
      width={chip.radius * 2}
      height={chip.radius * 2}
      opacity={chip.isCaptured ? 0.3 : 1}
      shadowColor="rgba(0, 0, 0, 0.4)"
      shadowBlur={shadowBlur}
      shadowOffset={{ x: 0, y: 4 }}
      shadowOpacity={0.5}
      scaleX={scale}
      scaleY={scale}
      onClick={() => onClick?.(chip.id)}
      onTap={() => onClick?.(chip.id)}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = chip.isActive && !chip.isCaptured ? 'pointer' : 'default';
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'default';
        }
      }}
      listening={chip.isActive && !chip.isCaptured}
    />
  );
};
