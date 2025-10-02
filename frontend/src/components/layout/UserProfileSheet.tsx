// src/components/layout/UserProfileSheet.tsx
import React, { useState, useMemo } from 'react';
import { User, LogOut, Settings, Archive, X } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../../hooks/useSocial';
import { simpleAuth } from '@/utils/simpleAuth';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/Button';
import { ResponsiveArchivedPosts } from '../modals/ResponsiveArchivedPosts';

interface UserType {
  id?: string;
  _id?: string;
  name?: string;
  profileImage?: string;
}

interface UserProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  trigger?: React.ReactNode;
}

export const UserProfileSheet: React.FC<UserProfileSheetProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  trigger
}) => {
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

  const avatarFallback = useMemo(() => 
    displayData.name?.[0] || "U",
    [displayData.name]
  );

  const handleProfileClick = () => {
    if (isConnected && stableUserId) {
      navigate(`/profile/${stableUserId}`);
      onClose();
    }
  };

  const handleDisconnect = async () => {
    try {
      onClose();
      await simpleAuth.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  const handleSettingsClick = () => {
    onClose();
    onOpenSettings();
  };

  const [isArchivedModalOpen, setIsArchivedModalOpen] = useState(false);

  const handleArchivedPostsClick = () => {
    onClose(); // Close sheet first
    setIsArchivedModalOpen(true);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side="right" className="w-[80vw] sm:w-[400px] md:w-[480px] lg:w-[540px] max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-left">{t('userSheet.title')}</SheetTitle>
          <SheetDescription className="text-left">
            {t('userSheet.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
              {isProfileLoading ? (
                <AvatarFallback className="animate-pulse bg-muted">
                  {avatarFallback}
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage 
                    src={displayData.avatar} 
                    alt={displayData.name || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">
                {isProfileLoading ? 'Loading...' : displayData.name}
              </h3>
              <p className="text-muted-foreground text-sm truncate">@{displayData.handle}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {profile?.bio || 'No bio available'}
              </p>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="space-y-1 sm:space-y-2">
            <Button
              variant="ghost"
              onClick={handleProfileClick}
              className="w-full justify-start h-10 sm:h-12 px-3 sm:px-4"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base">{t('userSheet.profile')}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{t('userSheet.profileDesc')}</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              onClick={handleArchivedPostsClick}
              className="w-full justify-start h-10 sm:h-12 px-3 sm:px-4"
            >
              <Archive className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base">{t('userSheet.archivedPosts')}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{t('userSheet.archivedPostsDesc')}</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              onClick={handleSettingsClick}
              className="w-full justify-start h-10 sm:h-12 px-3 sm:px-4"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base">{t('userSheet.settings')}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{t('userSheet.settingsDesc')}</div>
              </div>
            </Button>
          </div>

          {/* Logout */}
          <div className="border-t pt-3 sm:pt-4">
            <Button
              variant="ghost"
              onClick={handleDisconnect}
              className="w-full justify-start h-10 sm:h-12 px-3 sm:px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="font-medium text-sm sm:text-base">{t('userSheet.disconnect')}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{t('userSheet.disconnectDesc')}</div>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Responsive Archived Posts */}
      <ResponsiveArchivedPosts
        isOpen={isArchivedModalOpen}
        onClose={() => setIsArchivedModalOpen(false)}
      />
    </Sheet>
  );
};
