import React, { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { PhantomChip as PhantomChipType } from '../types';

/**
 * DUMB COMPONENT - Pure Presentation with Pulsing Animation
 * 
 * Renders a phantom chip for move preview using SVG with pulsing effect
 */

interface PhantomChipProps {
  phantomChip: PhantomChipType;
}

export const PhantomChip: React.FC<PhantomChipProps> = ({ phantomChip }) => {
  const imageRef = useRef<Konva.Image>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load SVG image based on chip type
  useEffect(() => {
    const img = new window.Image();
    img.src = phantomChip.type === 'CHASER' ? '/predator.svg' : '/runner.svg';
    img.onload = () => {
      setImage(img);
    };
  }, [phantomChip.type]);

  // Pulsing animation effect
  useEffect(() => {
    const imageNode = imageRef.current;
    if (!imageNode) return;

    // Create pulsing animation (opacity oscillates between 0.3 and 0.6)
    const animation = new Konva.Animation((frame) => {
      if (!frame) return;
      const period = 1500; // 1.5 seconds for full cycle
      const scale = Math.sin((frame.time * 2 * Math.PI) / period);
      const opacity = 0.45 + scale * 0.15; // oscillates between 0.3 and 0.6
      imageNode.opacity(opacity);
    }, imageNode.getLayer());

    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  if (!image) return null;

  return (
    <KonvaImage
      ref={imageRef}
      image={image}
      x={phantomChip.position.x - phantomChip.radius}
      y={phantomChip.position.y - phantomChip.radius}
      width={phantomChip.radius * 2}
      height={phantomChip.radius * 2}
      opacity={0.5}
      shadowColor="rgba(0, 0, 0, 0.3)"
      shadowBlur={10}
      shadowOffset={{ x: 0, y: 4 }}
      listening={false}
    />
  );
};
