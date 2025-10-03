// src/components/layout/NavItems.tsx
import { Home, Users, Bell, MessageSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useAppStore } from '@/store/useAppStore';
// Removed SwiperContext dependency

interface NavItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  isCenter?: boolean; // For center create post button
}

export const useNavItems = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppStore();
  const { unreadCount } = useUnreadCount(user?.hashId);

  const handleNavigation = (path: string) => {
    // Use regular navigation with state for slide animations
    navigate(path, { state: { from: location.pathname } });
  };

  const navItems: NavItem[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: t('nav.home'),
      onClick: () => handleNavigation('/feed')
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('nav.friends'),
      onClick: () => handleNavigation('/friend')
    },
    {
      icon: <Plus className="w-6 h-6" />,
      label: t('nav.create'),
      onClick: () => handleNavigation('/post'),
      isCenter: true
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: t('nav.notifications'),
      onClick: () => handleNavigation('/notifications'),
      badge: unreadCount.notifications > 0 ? unreadCount.notifications : undefined
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: t('nav.messages'),
      onClick: () => handleNavigation('/messages'),
      badge: unreadCount.messages > 0 ? unreadCount.messages : undefined
    }
  ];

  return navItems;
};