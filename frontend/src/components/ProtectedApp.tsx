// ProtectedApp.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { AuthConnect } from "@/components/auth/AuthConnect";
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
import { UnfollowConfirmProvider } from "@/contexts/UnfollowConfirmContext";

const ProtectedApp: React.FC = () => {
  const { isConnected, user } = useAppStore();
  if (!isConnected || !user) {
    return <AuthConnect />;
  }

  return (
    <UnfollowConfirmProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <Header />
        
        <main className="w-full px-0 py-6 lg:px-8">
          <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
            {/* Left Sidebar */}
            <aside className="hidden lg:block col-span-3">
              <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
                <SidebarLeft />
              </div>
            </aside>

            {/* Main Content */}
            <section className="col-span-12 lg:col-span-6">
              <TooltipProvider>
                <Routes>
                  <Route path="/profile/:userId" element={<ProfilePage />} />
                  <Route path="/profile/me" element={<ProfilePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/friend" element={<FriendPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
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
        </main>

      </div>
    </UnfollowConfirmProvider>
  );
};

export default ProtectedApp;