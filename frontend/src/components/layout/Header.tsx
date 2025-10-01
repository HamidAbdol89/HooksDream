// src/components/layout/Header.tsx - Desktop Only
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { Search } from 'lucide-react';
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

interface HeaderProps {
  isInChat?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isInChat = false }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { profile, user, isConnected } = useAppStore();
  const typedUser = user as UserType;
  
  const { useCurrentProfile } = useSocial();
  
  const stableUserId = useMemo(() => 
    user?.id || user?._id || typedUser?.id || typedUser?._id || profile?.id,
    [user?.id, user?._id, typedUser?.id, typedUser?._id, profile?.id]
  );

  const { 
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError
  } = useCurrentProfile();

  const displayData = useMemo(() => {
    const socialProfile = profileData?.data;
    
    const avatar = socialProfile?.avatar || profile?.avatar || '';
    const name = socialProfile?.displayName || user?.name || profile?.displayName || typedUser?.name || 'User';
    const handle = socialProfile?.username || profile?.username || user?.email || 'user';

    return { avatar, name, handle };
  }, [profileData?.data, user, profile, typedUser]);

  const navItems = useNavItems();
  
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSettingsView, setCurrentSettingsView] = useState<'main' | 'language' | 'theme'>('main');

  const openSettings = useCallback((view: 'main' | 'language' | 'theme' = 'main') => {
    setIsSettingsOpen(true);
    setCurrentSettingsView(view);
    setIsUserSheetOpen(false);
  }, []);

  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const avatarFallback = useMemo(() => 
    displayData.name?.[0] || "U",
    [displayData.name]
  );

  if (!isConnected) {
    return (
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="HooksDream"
                className="w-8 h-8 rounded-lg object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-foreground font-bold text-xl">HooksDream</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="hidden md:block bg-background sticky top-0 z-40 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo.png"
                alt="HooksDream"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <span className="text-foreground font-bold text-xl">HooksDream</span>
            </div>

            <div className="flex items-center space-x-4">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="p-2 hover:bg-accent rounded-lg transition-colors flex items-center space-x-2 relative"
                >
                  {item.icon}
                  <span className="text-sm text-foreground">{item.label}</span>
                  {item.badge && Number(item.badge) > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                    >
                      {Number(item.badge) > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {/* Search - Desktop only, next to avatar */}
              <button
                onClick={() => navigate('/search')}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsUserSheetOpen(true)}
                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="User menu"
              >
                <Avatar className="w-10 h-10">
                  {isProfileLoading ? (
                    <AvatarFallback className="animate-pulse bg-muted">
                      {avatarFallback}
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage 
                        src={displayData.avatar} 
                        alt={displayData.name || "User"}
                        onError={() => console.log('Avatar load failed, using fallback')}
                      />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </>
                  )}
                </Avatar>
              </button>
            </div>
          </div>
        </div>
      </header>

      <UserProfileSheet
        isOpen={isUserSheetOpen}
        onClose={() => setIsUserSheetOpen(false)}
        onOpenSettings={openSettings}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        currentView={currentSettingsView}
        onChangeView={setCurrentSettingsView}
      />
    </>
  );
};
