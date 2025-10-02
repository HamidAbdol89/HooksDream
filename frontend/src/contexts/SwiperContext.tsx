import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwiperContextType {
  swiperRef: React.MutableRefObject<any>;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  navigateToSlide: (index: number, path: string) => void;
}

const SwiperContext = createContext<SwiperContextType | null>(null);

// Page mapping
const PAGES = [
  { path: '/feed', index: 0 },
  { path: '/friend', index: 1 },
  { path: '/notifications', index: 2 },
  { path: '/messages', index: 3 }
];

export const SwiperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const swiperRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const navigateToSlide = useCallback((index: number, path: string) => {
    // Update index immediately for instant UI feedback
    setCurrentIndex(index);
    
    // Navigate immediately (no delay)
    navigate(path);
    
    // Slide to position
    if (swiperRef.current) {
      swiperRef.current.slideTo(index, 300);
    }
  }, [navigate]);

  return (
    <SwiperContext.Provider value={{
      swiperRef,
      currentIndex,
      setCurrentIndex,
      navigateToSlide
    }}>
      {children}
    </SwiperContext.Provider>
  );
};

export const useSwiper = () => {
  const context = useContext(SwiperContext);
  if (!context) {
    // Return safe fallback instead of throwing
    return {
      swiperRef: { current: null },
      currentIndex: 0,
      setCurrentIndex: () => {},
      navigateToSlide: () => {}
    };
  }
  return context;
};
