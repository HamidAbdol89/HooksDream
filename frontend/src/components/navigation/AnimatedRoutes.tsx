import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';

// Import page components
import { Feed } from '@/pages/FeedPage';
import FriendPage from '@/pages/MobileFriendPage';
import NotificationsPage from '@/pages/NotificationsPage';
import MessagesPage from '@/pages/MessagesPage';
import { StoriesPage } from '@/pages/StoriesPage';

const PAGES = [
  { path: '/stories', component: StoriesPage, title: 'Stories' },
  { path: '/feed', component: Feed, title: 'Feed' },
  { path: '/friend', component: FriendPage, title: 'Bạn bè' },
  { path: '/notifications', component: NotificationsPage, title: 'Thông báo' },
  { path: '/messages', component: MessagesPage, title: 'Chat' },
];

// Slide animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

// Get direction for slide animation based on page order
const getDirection = (currentPath: string, previousPath: string) => {
  const currentIndex = PAGES.findIndex(page => page.path === currentPath);
  const previousIndex = PAGES.findIndex(page => page.path === previousPath);
  
  if (currentIndex === -1 || previousIndex === -1) return 0;
  
  return currentIndex > previousIndex ? 1 : -1;
};

// Enhanced slide variants with better easing
const enhancedSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
};

export const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Auto redirect root path to /feed
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/feed', { replace: true });
      return;
    }
  }, [location.pathname, navigate]);
  
  // Don't render while redirecting from root
  if (location.pathname === '/') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const currentPageIndex = PAGES.findIndex(page => page.path === location.pathname);
  
  // If not a main page, render without animation
  if (currentPageIndex === -1) {
    return (
      <div className="w-full h-full">
        <Routes>
          {PAGES.map((page) => {
            const PageComponent = page.component;
            return (
              <Route 
                key={page.path} 
                path={page.path} 
                element={<PageComponent />} 
              />
            );
          })}
        </Routes>
      </div>
    );
  }
  
  // For mobile, use enhanced slide animations
  if (isMobile) {
    const direction = getDirection(location.pathname, location.state?.from || '/feed');
    
    return (
      <div className="w-full h-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={enhancedSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.35,
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smooth feel
            }}
            className="w-full h-full"
          >
            <Routes location={location}>
              {PAGES.map((page) => {
                const PageComponent = page.component;
                return (
                  <Route 
                    key={page.path} 
                    path={page.path} 
                    element={<PageComponent />} 
                  />
                );
              })}
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
  
  // For desktop, no animations
  return (
    <div className="w-full h-full">
      <Routes>
        {PAGES.map((page) => {
          const PageComponent = page.component;
          return (
            <Route 
              key={page.path} 
              path={page.path} 
              element={<PageComponent />} 
            />
          );
        })}
      </Routes>
    </div>
  );
};

export default AnimatedRoutes;
