// ProtectedApp.tsx - Enhanced with Framer Motion transitions
import React, { Suspense, useState, useEffect, startTransition } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { useChatContext } from "@/contexts/ChatContext";
import { UnfollowConfirmProvider } from "@/contexts/UnfollowConfirmContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SwiperProvider } from "@/contexts/SwiperContext";
import { ToastProvider } from "@/components/ui/SuccessToast";
import { TooltipProvider } from "@radix-ui/react-tooltip";
// Lazy load ALL components for better performance and faster navigation
const SwiperCarousel = React.lazy(() => import("@/components/navigation/SwiperCarousel").then(module => ({ default: module.SwiperCarousel })));
const SearchPage = React.lazy(() => import("@/pages/SearchPage"));
const ProfilePage = React.lazy(() => import("@/pages/ProfilePage"));
const PostDetailPage = React.lazy(() => import("@/pages/PostDetailPage"));
const EditProfilePage = React.lazy(() => import("@/pages/EditProfilePage"));
const CreatePostPage = React.lazy(() => import("@/pages/CreatePostPage").then(module => ({ default: module.CreatePostPage })));
const MessagesPage = React.lazy(() => import("@/pages/MessagesPage"));
const NotificationsPage = React.lazy(() => import("@/pages/NotificationsPage"));
const FriendPage = React.lazy(() => import("@/pages/MobileFriendPage"));

const ProtectedAppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isConnected, user, profile } = useAppStore();
  const { selectedConversationId } = useChatContext();
  const { isConnected: socketConnected, connectionError } = useSocket();
  
  // Check persistent session to prevent flash
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  useEffect(() => {
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
          
          // Auto redirect to feed if on root path
          if (location.pathname === '/') {
            navigate('/feed', { replace: true });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      setIsCheckingSession(false);
    };
    
    checkSession();
  }, [isConnected, user, location.pathname, navigate]);
  
  // Check if current page should hide sidebars
  const isEditProfilePage = location.pathname === '/edit-profile' || location.pathname.startsWith('/edit-profile/');
  const isCreatePostPage = location.pathname === '/post';
  const isMessagesPage = location.pathname.startsWith('/messages');
  const isMessagesListPage = location.pathname === '/messages'; // Only the main messages page
  const hasConversationId = Boolean(location.pathname.match(/^\/messages\/[^?]+/)); // Check if URL has conversationId
  const isInChat = isMessagesPage && hasConversationId; // Individual chat = full-screen
  
  const isSearchPage = location.pathname === '/search';
  
  // MobileHeader only shows on feed page (not on search page or in individual chats)
  const shouldShowMobileHeader = (location.pathname === '/feed' || location.pathname === '/') && !isSearchPage && !isInChat;

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 flex items-center justify-center mx-auto">
            <img 
              src="/logo.png" 
              alt="HooksDream Logo" 
              className="w-20 h-20 object-contain animate-pulse" 
            />
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading HooksDream...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !user) {
    return <ModernAuthConnect />;
  }

  return (
    <SwiperProvider>
      <UnfollowConfirmProvider>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Desktop Header */}
        {!isEditProfilePage && !isCreatePostPage && !isSearchPage && <Header isInChat={isInChat} />}
        
        {/* Mobile Header - Only show on specific pages */}
        {shouldShowMobileHeader && <MobileHeader />}
        
        {/* Mobile Bottom Navigation - Hide on search page and in individual chats */}
        {!isEditProfilePage && !isCreatePostPage && !isSearchPage && !isInChat && <BottomNav isInChat={isInChat} />}
        
        <main className={`w-full ${shouldShowMobileHeader ? 'pt-16' : ''} ${isMessagesPage || isInChat || isEditProfilePage || isCreatePostPage || isSearchPage ? 'px-0 py-0' : 'px-0 py-6'}`}>
          {isEditProfilePage ? (
            // Full width layout for Edit Profile page
            <div className="w-full">
              <ToastProvider>
                <TooltipProvider>
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="text-center space-y-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    </div>
                  }>
                    <Routes>
                      <Route path="/edit-profile/:address" element={<EditProfilePage />} />
                      <Route path="/edit-profile" element={<EditProfilePage />} />
                    </Routes>
                  </Suspense>
                </TooltipProvider>
              </ToastProvider>
            </div>
          ) : isCreatePostPage ? (
            // Full width layout for Create Post page
            <div className="w-full">
              <ToastProvider>
                <TooltipProvider>
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="text-center space-y-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    </div>
                  }>
                    <Routes>
                      <Route path="/post" element={<CreatePostPage />} />
                    </Routes>
                  </Suspense>
                </TooltipProvider>
              </ToastProvider>
            </div>
          ) : isInChat ? (
            // Full width layout for Messages page and individual chats
            <div className={`w-full ${isInChat && isMobile ? 'h-screen' : 'h-[calc(100vh-64px)]'}`}>
              <TooltipProvider>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center space-y-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/messages/*" element={<MessagesPage />} />
                  </Routes>
                </Suspense>
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
                      {/* Profile pages - Motion transitions */}
                      <Route path="/profile/:userId" element={
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <React.Suspense fallback={
                            <div className="flex items-center justify-center h-screen">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          }>
                            <ProfilePage />
                          </React.Suspense>
                        </motion.div>
                      } />
                      <Route path="/profile/me" element={
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <React.Suspense fallback={
                            <div className="flex items-center justify-center h-screen">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          }>
                            <ProfilePage />
                          </React.Suspense>
                        </motion.div>
                      } />
                      
                      {/* Post detail - Motion transitions */}
                      <Route path="/post/:postId" element={
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <React.Suspense fallback={
                            <div className="flex items-center justify-center h-screen">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          }>
                            <PostDetailPage />
                          </React.Suspense>
                        </motion.div>
                      } />
                      
                      {/* Search page - Special motion */}
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
                      
                      {/* SwiperCarousel handles: /, /feed, /friend, /notifications, /messages */}
                      {/* NO motion here - SwiperCarousel has its own swipe animations */}
                      <Route path="/*" element={
                        <React.Suspense fallback={
                          <div className="flex items-center justify-center h-screen">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        }>
                          <SwiperCarousel />
                        </React.Suspense>
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
    </SwiperProvider>
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
