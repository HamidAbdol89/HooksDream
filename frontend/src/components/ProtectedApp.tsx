// ProtectedApp.tsx - Enhanced with Framer Motion transitions
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAppStore } from "@/store/useAppStore";
import { useSocket } from "@/hooks/useSocket";
import ModernAuthConnect from "@/components/auth/ModernAuthConnect";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import SidebarLeft from "@/components/layout/SidebarLeft";
import { SidebarRight } from "@/components/layout/SidebarRight";
import { UnfollowConfirmProvider } from "@/contexts/UnfollowConfirmContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ToastProvider } from "@/components/ui/SuccessToast";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { SwiperCarousel } from "@/components/navigation/SwiperCarousel";
import { Feed } from "../pages/FeedPage";
import ProfilePage from "@/pages/ProfilePage";
import PostDetailPage from "@/pages/PostDetailPage";
import FriendPage from "@/pages/FriendPage";
import MessagesPage from "@/pages/MessagesPage";
import EditProfilePage from "@/pages/EditProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import { CreatePostPage } from "@/pages/CreatePostPage";

// Lazy load SearchPage for better performance
const SearchPage = React.lazy(() => import("@/pages/SearchPage"));

const ProtectedAppContent: React.FC = () => {
  const { isConnected, user } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Initialize Socket connection
  const { isConnected: socketConnected, connectionError } = useSocket();
  
  // Check persistent session to prevent flash
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        // Use SessionManager to check for valid session
        const { SessionManager } = await import('@/utils/sessionManager');
        const savedSession = SessionManager.getAuthSession();
        
        if (savedSession && savedSession.user) {
          // Valid session exists, populate store if needed
          if (!isConnected || !user) {
            const { setIsConnected, setUser, setProfile } = useAppStore.getState();
            setIsConnected(true);
            setUser(savedSession.user);
            setProfile(savedSession.profile || savedSession.user);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      setIsCheckingSession(false);
    };
    
    checkSession();
  }, [isConnected, user]);
  
  // Check if current page should hide sidebars
  const isEditProfilePage = location.pathname === '/edit-profile' || location.pathname.startsWith('/edit-profile/');
  const isCreatePostPage = location.pathname === '/post';
  const isMessagesPage = location.pathname.startsWith('/messages');
  const isInChat = isMessagesPage && location.pathname !== '/messages';
  const isSearchPage = location.pathname === '/search';
  
  // MobileHeader only shows on feed page (not on search page)
  const shouldShowMobileHeader = (location.pathname === '/feed' || location.pathname === '/') && !isSearchPage;

  if (!isConnected || !user) {
    return <ModernAuthConnect />;
  }

  return (
    <UnfollowConfirmProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Desktop Header */}
        {!isEditProfilePage && !isCreatePostPage && !isSearchPage && <Header isInChat={isInChat} />}
        
        {/* Mobile Header - Only show on specific pages */}
        {shouldShowMobileHeader && <MobileHeader />}
        
        {/* Mobile Bottom Navigation - Hide on search page */}
        {!isEditProfilePage && !isCreatePostPage && !isSearchPage && <BottomNav isInChat={isInChat} />}
        
        <main className={`w-full ${isMessagesPage || isInChat || isEditProfilePage || isCreatePostPage || isSearchPage ? 'px-0 py-0' : 'px-0 py-6'}`}>
          {isEditProfilePage ? (
            // Full width layout for Edit Profile page
            <div className="w-full">
              <ToastProvider>
                <TooltipProvider>
                  <Routes>
                    <Route path="/edit-profile/:address" element={<EditProfilePage />} />
                    <Route path="/edit-profile" element={<EditProfilePage />} />
                  </Routes>
                </TooltipProvider>
              </ToastProvider>
            </div>
          ) : isCreatePostPage ? (
            // Full width layout for Create Post page
            <div className="w-full">
              <TooltipProvider>
                <Routes>
                  <Route path="/post" element={<CreatePostPage />} />
                </Routes>
              </TooltipProvider>
            </div>
          ) : isMessagesPage || isInChat ? (
            // Full width layout for Messages page and individual chats
            <div className={`w-full ${isInChat && isMobile ? 'h-screen' : 'h-[calc(100vh-64px)]'}`}>
              <TooltipProvider>
                <Routes>
                  <Route path="/messages/*" element={<MessagesPage />} />
                </Routes>
              </TooltipProvider>
            </div>
          ) : (
            // Standard layout with sidebars for other pages - ADD GESTURE SUPPORT HERE
            <div className="w-full lg:grid lg:grid-cols-12 lg:gap-6 lg:px-8">
              {/* Left Sidebar - Hidden when in chat */}
              {!isInChat && (
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <SidebarLeft />
                  </div>
                </aside>
              )}

              {/* Main Content - WITH GESTURE SUPPORT */}
              <section className={`w-full ${!isInChat ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
                <TooltipProvider>
                  <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                      <Route path="/profile/:userId" element={
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <ProfilePage />
                        </motion.div>
                      } />
                      <Route path="/profile/me" element={
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <ProfilePage />
                        </motion.div>
                      } />
                      <Route path="/post/:postId" element={
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <PostDetailPage />
                        </motion.div>
                      } />
                      <Route path="/search" element={
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="h-full"
                        >
                          <React.Suspense fallback={
                            <div className="flex items-center justify-center h-screen">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          }>
                            <SearchPage />
                          </React.Suspense>
                        </motion.div>
                      } />
                      {/* SwiperCarousel handles all main navigation */}
                      <Route path="/*" element={
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SwiperCarousel />
                        </motion.div>
                      } />
                    </Routes>
                  </AnimatePresence>
                </TooltipProvider>
              </section>

              {/* Right Sidebar */}
              <aside className="hidden lg:block lg:col-span-3">
                <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                  <SidebarRight />
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </UnfollowConfirmProvider>
  );
};

const ProtectedAppSimple: React.FC = () => {
  return (
    <ChatProvider>
      <ProtectedAppContent />
    </ChatProvider>
  );
};

export default ProtectedAppSimple;
