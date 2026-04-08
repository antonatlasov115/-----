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
        // Use smaller padding on mobile for more game area
        const effectivePadding = Math.min(mobilePadding, 40);
        width = window.innerWidth - effectivePadding;
        height = window.innerHeight - effectivePadding;
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

    // Debounce resize for better performance
    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateSize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', calculateSize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', calculateSize);
      clearTimeout(resizeTimer);
    };
  }, [sidebarWidth, mobileBreakpoint, mobilePadding, desktopPadding]);

  return viewportSize;
};
