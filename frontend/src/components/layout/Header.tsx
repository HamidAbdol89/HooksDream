// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { User, LogOut, Settings, X } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { SettingsModal } from './setting/SettingsModal';
import { MobileSearch } from './MobileSearch';
import { useNavItems } from './NavItems';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../../hooks/useSocial';

interface UserType {
  id?: string;
  _id?: string;
  name?: string;
  profileImage?: string;
}

export const Header: React.FC = () => {
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
    const socialProfile = profileData?.data;
    
    // Priority: Social profile > AppStore user > AppStore profile > Web3Auth
    const avatar = socialProfile?.avatar || 
                  user?.avatar || 
                  profile?.avatar || 
                  typedUser?.profileImage;

    const name = socialProfile?.displayName || 
                user?.name || 
                user?.displayName || 
                profile?.name || 
                typedUser?.name || 'User';

    const handle = socialProfile?.username ||
                  user?.handle || 
                  profile?.handle || 
                  user?.email || 
                  profile?.email || 
                  'user';

    return { avatar, name, handle };
  }, [profileData?.data, user, profile, typedUser]);

  // Navigation function
  const navItems = useNavItems(useCallback(() => setIsSearchOpen(true), []));
  
  // State và refs
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentSettingsView, setCurrentSettingsView] = useState<'main' | 'language' | 'theme'>('main');

  // 🔥 MEMOIZED CALLBACKS - tránh re-render children
  const openSettings = useCallback((view: 'main' | 'language' | 'theme' = 'main') => {
    setIsSettingsOpen(true);
    setCurrentSettingsView(view);
    setIsUserMenuOpen(false);
    setIsMobileUserMenuOpen(false);
  }, []);

  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const handleDisconnect = useCallback(async () => {
    try {
      // Đóng tất cả menu trước
      setIsUserMenuOpen(false);
      setIsMobileUserMenuOpen(false);
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

  const handleProfileClick = useCallback(() => {
    if (isConnected && stableUserId) {
      navigate(`/profile/${stableUserId}`);
      setIsUserMenuOpen(false);
      setIsMobileUserMenuOpen(false);
    }
  }, [isConnected, stableUserId, navigate]);

  // Auto focus search input khi mở trên mobile
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Đóng mobile search khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSearchOpen && searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserMenuOpen && !target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // 🔥 LOADING STATE CHO AVATAR - tránh flickering
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
      {/* Header chính - Desktop */}
      <header className="hidden md:block bg-background sticky top-0 z-40 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo và tên */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo.png"
                alt="HooksDream"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <span className="text-foreground font-bold text-xl">HooksDream</span>
            </div>

            {/* Nav items - Desktop */}
            <div className="flex items-center space-x-4">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="p-2 hover:bg-accent rounded-lg transition-colors flex items-center space-x-2"
                >
                  {item.icon}
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              ))}
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="User menu"
                >
                  <Avatar className="w-10 h-10">
                    {/* 🔥 CONDITIONAL RENDERING cho loading state */}
                    {isProfileLoading ? (
                      <AvatarFallback className="animate-pulse bg-muted">
                        {avatarFallback}
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage 
                          src={displayData.avatar} 
                          alt={displayData.name || "User"}
                          // 🔥 THÊM onError handler
                          onError={() => console.log('Avatar load failed, using fallback')}
                        />
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                </button>

                {/* Desktop User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-lg border p-1 z-50">
                    {/* User info */}
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">
                        {isProfileLoading ? 'Loading...' : (displayData.name || t('header.user'))}
                      </p>
                      <p className="text-xs text-muted-foreground">{displayData.handle}</p>
                    </div>

                    <button 
                      onClick={handleProfileClick}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent rounded-md flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>{t('header.profile')}</span>
                    </button>

                    <button
                      onClick={() => openSettings()}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent rounded-md flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>{t('header.settings')}</span>
                    </button>

                    <div className="border-t mt-1 pt-1">
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 rounded-md flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('header.disconnect')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation items - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-30 shadow-lg">
        <div className="max-w-md mx-auto px-2">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="flex-1 p-2 hover:bg-accent rounded-md transition-colors flex flex-col items-center"
              >
                {item.icon}
              </button>
            ))}
            {/* Nút user avatar */}
            <button
              onClick={() => setIsMobileUserMenuOpen(true)}
              className="flex-1 p-2 hover:bg-accent rounded-md transition-colors flex flex-col items-center"
            >
              <Avatar className="w-6 h-6">
                {isProfileLoading ? (
                  <AvatarFallback className="animate-pulse bg-muted text-xs">
                    {avatarFallback}
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={displayData.avatar} alt={displayData.name || "User"} />
                    <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                  </>
                )}
              </Avatar>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Full Screen User Menu */}
      {isMobileUserMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{t('header.userMenu')}</h2>
              <button
                onClick={() => setIsMobileUserMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-accent"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4 p-4 bg-accent rounded-lg m-4">
              <Avatar className="w-16 h-16">
                {isProfileLoading ? (
                  <AvatarFallback className="animate-pulse bg-muted">
                    {avatarFallback}
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage src={displayData.avatar} alt={displayData.name || "User"} />
                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </>
                )}
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium">
                  {isProfileLoading ? 'Loading...' : (displayData.name || t('header.user'))}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {displayData.handle}
                </p>
                  <p className="text-xs text-muted-foreground mt-1">
                  </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2 p-4">
              <button 
                onClick={handleProfileClick}
                className="w-full flex items-center space-x-3 p-4 text-left hover:bg-accent rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{t('header.profile')}</span>
              </button>
              
              <button 
                onClick={() => openSettings()}
                className="w-full flex items-center space-x-3 p-4 text-left hover:bg-accent rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">{t('header.settings')}</span>
              </button>
              
              <div className="border-t pt-2 mt-4">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center space-x-3 p-4 text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('header.disconnect')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        currentView={currentSettingsView}
        onChangeView={setCurrentSettingsView}
        onClose={closeSettings}
      />

      {/* Mobile Search */}
      <MobileSearch 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchInputRef={searchInputRef}
      />
    </>
  );
};
