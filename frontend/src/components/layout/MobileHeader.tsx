// src/components/layout/MobileHeader.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Search, Bell, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useSocial } from '@/hooks/useSocial';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { UserProfileSheet } from './UserProfileSheet';
import { SettingsModal } from './setting/SettingsModal';
import { motion } from 'framer-motion';

interface MobileHeaderProps {
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ className = '' }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { profile, user, isConnected } = useAppStore();
  const { useCurrentProfile } = useSocial();
  const { unreadCount } = useUnreadCount(user?.hashId);
  const { isVisible } = useScrollDirection({ threshold: 10 });

  // Profile data
  const { data: profileData, isLoading: isProfileLoading } = useCurrentProfile();
  const currentUserProfile = profileData?.data;

  // User display data
  const displayData = useMemo(() => {
    const fallbackData = {
      username: user?.name || profile?.username || 'User',
      avatar: profile?.avatar || '',
      displayName: profile?.displayName || user?.name || 'User'
    };

    if (!isConnected || isProfileLoading) {
      return fallbackData;
    }

    return {
      username: currentUserProfile?.username || fallbackData.username,
      avatar: currentUserProfile?.avatar || fallbackData.avatar,
      displayName: currentUserProfile?.displayName || fallbackData.displayName
    };
  }, [isConnected, isProfileLoading, currentUserProfile, user, profile]);

  const { username, avatar, displayName } = displayData;

  // Avatar fallback
  const avatarFallback = useMemo(() => 
    (displayName || username || 'U').charAt(0).toUpperCase(),
    [displayName, username]
  );

  // State management
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSettingsView, setCurrentSettingsView] = useState<'main' | 'language' | 'theme'>('main');

  // Callbacks
  const openSettings = useCallback((view: 'main' | 'language' | 'theme' = 'main') => {
    setIsSettingsOpen(true);
    setCurrentSettingsView(view);
    setIsUserSheetOpen(false);
  }, []);

  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const handleSearchClick = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  const handleNotificationsClick = useCallback(() => {
    navigate('/notifications');
  }, [navigate]);

  const handleAvatarClick = useCallback(() => {
    setIsUserSheetOpen(true);
  }, []);

  const handleStoriesClick = useCallback(() => {
    navigate('/stories');
  }, [navigate]);

  return (
    <>
      {/* Mobile Header - Only visible on mobile with scroll animation */}
      <motion.div 
        className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-background ${className}`}
        initial={{ y: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ 
          duration: 0.3, 
          ease: "easeInOut"
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Logo */}
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="HooksDream" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-lg">HooksDream</span>
          </div>

          {/* Right side - Icons */}
          <div className="flex items-center space-x-3">
            {/* Stories */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStoriesClick}
              className="p-2"
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
            </Button>

            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchClick}
              className="p-2"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* User Avatar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAvatarClick}
              className="p-1"
            >
              <Avatar className="w-8 h-8">
                {isProfileLoading ? (
                  <AvatarFallback className="animate-pulse bg-muted text-xs">
                    {avatarFallback}
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage 
                      src={avatar} 
                      alt={displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xs">
                      {avatarFallback}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
            </Button>
          </div>
        </div>
      </motion.div>

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
