import { useState, useEffect } from 'react';

interface ViewportConfig {
  sidebarWidth?: number;
  mobileBreakpoint?: number;
  mobilePadding?: number;
  desktopPadding?: number;
}

interface ViewportSize {
  width: number;
  height: number;
  isMobile: boolean;
}

/**
 * Hook for calculating optimal viewport size for game board
 * Configurable and reusable across components
 */
export const useViewportSize = (config: ViewportConfig = {}): ViewportSize => {
  const {
    sidebarWidth = 300,
    mobileBreakpoint = 768,
    mobilePadding = 120,
    desktopPadding = 0,
  } = config;

  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    width: 0,
    height: 0,
    isMobile: false,
  });

  useEffect(() => {
    const calculateSize = () => {
      const isMobile = window.innerWidth <= mobileBreakpoint;
      
      let width: number;
      let height: number;

      if (isMobile) {
        width = window.innerWidth - mobilePadding;
        height = window.innerHeight - mobilePadding;
      } else {
        width = window.innerWidth - sidebarWidth - desktopPadding;
        height = window.innerHeight - desktopPadding;
      }

      setViewportSize({
        width: Math.max(width, 100),
        height: Math.max(height, 100),
        isMobile,
      });
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    
    return () => window.removeEventListener('resize', calculateSize);
  }, [sidebarWidth, mobileBreakpoint, mobilePadding, desktopPadding]);

  return viewportSize;
};
