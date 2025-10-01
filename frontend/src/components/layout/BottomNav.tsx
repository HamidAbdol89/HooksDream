// src/components/layout/BottomNav.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { User, LogOut, Settings, X } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { SettingsModal } from './setting/SettingsModal';
import { useNavItems } from './NavItems';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../../hooks/useSocial';
import { Badge } from '@/components/ui/badge';
import { UserProfileSheet } from './UserProfileSheet';

interface UserType {
  id?: string;
  _id?: string;
  name?: string;
  profileImage?: string;
}

interface BottomNavProps {
  isInChat?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ isInChat = false }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { profile, user, isConnected } = useAppStore();
  const { logout } = useGoogleAuth();
  const typedUser = user as UserType;
  
  // 🔥 SỬ DỤNG useSocial THAY VÌ useAppStore cho profile data
  const { useCurrentProfile } = useSocial();
  
  // 🔥 STABLE USER ID - tránh re-render không cần thiết
  const stableUserId = useMemo(() => 
    user?.id || user?._id || typedUser?.id || typedUser?._id || profile?.id,
    [user?.id, user?._id, typedUser?.id, typedUser?._id, profile?.id]
  );

  // 🔥 CHỈ FETCH KHI CÓ USER ID VÀ CONNECTED
  const { 
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError
  } = useCurrentProfile();

  // 🔥 MEMOIZED DATA GETTERS - tránh tính toán lại không cần thiết
  const displayData = useMemo(() => {
    const fallbackData = {
      username: user?.name || typedUser?.name || profile?.username || 'User',
      avatar: profile?.avatar || '',
      displayName: profile?.displayName || user?.name || typedUser?.name || 'User'
    };

    if (!isConnected || !stableUserId || isProfileLoading) {
      return fallbackData;
    }

    if (profileError) {
      console.warn('Profile fetch error:', profileError);
      return fallbackData;
    }

    return {
      username: profileData?.data?.username || fallbackData.username,
      avatar: profileData?.data?.avatar || fallbackData.avatar,
      displayName: profileData?.data?.displayName || fallbackData.displayName
    };
  }, [isConnected, stableUserId, isProfileLoading, profileError, profileData, user, typedUser, profile]);

  const { username, avatar, displayName } = displayData;

  // Avatar fallback
  const avatarFallback = useMemo(() => 
    (displayName || username || 'U').charAt(0).toUpperCase(),
    [displayName, username]
  );

  // Navigation function
  const navItems = useNavItems();
  
  // State và refs
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSettingsView, setCurrentSettingsView] = useState<'main' | 'language' | 'theme'>('main');

  // 🔥 MEMOIZED CALLBACKS - tránh re-render children
  const openSettings = useCallback((view: 'main' | 'language' | 'theme' = 'main') => {
    setIsSettingsOpen(true);
    setCurrentSettingsView(view);
    setIsUserSheetOpen(false);
  }, []);

  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const handleDisconnect = useCallback(async () => {
    try {
      // Đóng tất cả menu trước
      setIsUserSheetOpen(false);
      setIsSettingsOpen(false);
      
      // Thực hiện logout
      await logout();
      
      // Force redirect về trang đăng nhập
      window.location.href = '/';
    } catch (error) {
      // Nếu có lỗi, vẫn redirect
      window.location.href = '/';
    }
  }, [logout]);

  // Nếu đang trong chat, ẩn bottom nav
  if (isInChat) {
    return null;
  }

  return (
    <>
      {/* Navigation items - Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-30">
  <div className="max-w-md mx-auto">
    <div className="flex items-center justify-around h-16">
      {navItems.map((item, index) => (
        <div key={index} className="flex-1 flex justify-center">
          <button
            onClick={item.onClick}
            className={`
              relative flex flex-col items-center justify-center
              transition-transform duration-150 active:scale-95
              ${item.isCenter 
                ? 'w-14 h-14 -mt-6 rounded-full bg-primary text-primary-foreground shadow-md border-4 border-background' 
                : 'w-12 h-12 rounded-xl text-muted-foreground aria-[current=page]:text-primary'}
            `}
            aria-current={undefined}
          >
            {item.icon}
            
            {/* Badge */}
            {item.badge && Number(item.badge) > 0 && (
              <span className={`
                absolute bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px]
                flex items-center justify-center px-1 border-2 border-background
                ${item.isCenter ? 'top-1 right-1' : 'top-0 right-0'}
              `}>
                {Number(item.badge) > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  </div>
</div>


      {/* User Profile Sheet */}
      <UserProfileSheet
        isOpen={isUserSheetOpen}
        onClose={() => setIsUserSheetOpen(false)}
        onOpenSettings={openSettings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        currentView={currentSettingsView}
        onChangeView={setCurrentSettingsView}
      />
    </>
  );
};
