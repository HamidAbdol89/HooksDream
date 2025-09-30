// ProtectedApp.tsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import ModernAuthConnect from "@/components/auth/ModernAuthConnect";
import { Header } from "@/components/layout/Header";
import SidebarLeft from "@/components/layout/SidebarLeft";
import { SidebarRight } from "@/components/layout/SidebarRight";
import { Feed } from "../pages/FeedPage";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import ProfilePage from "@/pages/ProfilePage";
import SearchPage from "@/pages/SearchPage";
import PostDetailPage from "@/pages/PostDetailPage";
import FriendPage from "@/pages/FriendPage";
import MessagesPage from "@/pages/MessagesPage";
import EditProfilePage from "@/pages/EditProfilePage";
import { UnfollowConfirmProvider } from "@/contexts/UnfollowConfirmContext";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { useSocket } from "@/hooks/useSocket";
import { ToastProvider } from "@/components/ui/SuccessToast";
import { useIsMobile } from "@/hooks/useIsMobile";

const ProtectedAppContent: React.FC = () => {
  const { isConnected, user } = useAppStore();
  const location = useLocation();
  const isMobile = useIsMobile(); // ✅ Use centralized hook
  
  // Initialize Socket connection
  const { isConnected: socketConnected, connectionError } = useSocket();
  
  // ✅ Check persistent session to prevent flash
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
  const isMessagesPage = location.pathname === '/messages';
  const isEditProfilePage = location.pathname.startsWith('/edit-profile');
  // Get chat context
  const { selectedConversationId } = useChatContext();
  const isInChat = isMessagesPage && !!selectedConversationId && isMobile;
  

  
  if (!isConnected || !user) {
    return <ModernAuthConnect />;
  }

  return (
    <UnfollowConfirmProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Hide header when in individual chat or edit profile */}
        {!isEditProfilePage && <Header isInChat={isInChat} />}
        
        <main className={`w-full ${isMessagesPage || isInChat || isEditProfilePage ? 'px-0 py-0' : 'px-0 py-6'}`}>
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
            // Standard layout with sidebars for other pages
            <div className="w-full lg:grid lg:grid-cols-12 lg:gap-6 lg:px-8">
              {/* Left Sidebar - Hidden when in chat */}
              {!isInChat && (
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <SidebarLeft />
                  </div>
                </aside>
              )}

              {/* Main Content */}
              <section className={`w-full ${!isInChat ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
                <TooltipProvider>
                  <Routes>
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    <Route path="/profile/me" element={<ProfilePage />} />
                    <Route path="/edit-profile/:address" element={<EditProfilePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/friend" element={<FriendPage />} />
                    <Route path="/post/:postId" element={<PostDetailPage />} />
                    <Route path="/*" element={<Feed />} />
                  </Routes>
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

const ProtectedApp: React.FC = () => {
  return (
    <ChatProvider>
      <ProtectedAppContent />
    </ChatProvider>
  );
};

export default ProtectedApp;