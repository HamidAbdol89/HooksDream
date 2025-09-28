// ProtectedApp.tsx
import React, { useState, useEffect } from "react";
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

const ProtectedAppContent: React.FC = () => {
  const { isConnected, user } = useAppStore();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Initialize Socket connection
  const { isConnected: socketConnected, connectionError } = useSocket();
  
  // Track mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Check if current page should hide sidebars
  const isMessagesPage = location.pathname === '/messages';
  const isEditProfilePage = location.pathname === '/edit-profile';
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
        
        <main className={`w-full ${isMessagesPage || isInChat || isEditProfilePage ? 'px-0 py-0' : 'px-0 py-6 lg:px-8'}`}>
          {isEditProfilePage ? (
            // Full width layout for Edit Profile page
            <div className="w-full">
              <TooltipProvider>
                <Routes>
                  <Route path="/edit-profile" element={<EditProfilePage />} />
                </Routes>
              </TooltipProvider>
            </div>
          ) : isMessagesPage || isInChat ? (
            // Full width layout for Messages page and individual chats
            <div className={`w-full ${isInChat && isMobile ? 'h-screen' : 'h-[calc(100vh-64px)]'}`}>
              <TooltipProvider>
                <Routes>
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/messages/*" element={<MessagesPage />} />
                </Routes>
              </TooltipProvider>
            </div>
          ) : (
            // Standard layout with sidebars for other pages
            <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
              {/* Left Sidebar - Hidden when in chat */}
              {!isInChat && (
                <aside className="hidden lg:block col-span-3">
                  <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                    <SidebarLeft />
                  </div>
                </aside>
              )}

              {/* Main Content */}
              <section className={`col-span-12 ${!isInChat ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
                <TooltipProvider>
                  <Routes>
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    <Route path="/profile/me" element={<ProfilePage />} />
                    <Route path="/edit-profile" element={<EditProfilePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/friend" element={<FriendPage />} />
                    <Route path="/post/:postId" element={<PostDetailPage />} />
                    <Route path="/*" element={<Feed />} />
                  </Routes>
                </TooltipProvider>
              </section>

              {/* Right Sidebar */}
              <aside className="hidden lg:block col-span-3">
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