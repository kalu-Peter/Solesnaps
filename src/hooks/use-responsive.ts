import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const breakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export type Breakpoint = keyof BreakpointConfig;

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < breakpoints.sm;
  const isTablet = windowWidth >= breakpoints.sm && windowWidth < breakpoints.lg;
  const isDesktop = windowWidth >= breakpoints.lg;

  const isBreakpoint = (breakpoint: Breakpoint): boolean => {
    return windowWidth >= breakpoints[breakpoint];
  };

  const isBetween = (min: Breakpoint, max: Breakpoint): boolean => {
    return windowWidth >= breakpoints[min] && windowWidth < breakpoints[max];
  };

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    isBreakpoint,
    isBetween,
    breakpoints,
  };
}

// Hook for mobile detection specifically
export function useMobile() {
  const { isMobile } = useResponsive();
  return isMobile;
}

// Hook for checking if screen is at least a certain size
export function useMinWidth(breakpoint: Breakpoint) {
  const { isBreakpoint } = useResponsive();
  return isBreakpoint(breakpoint);
}