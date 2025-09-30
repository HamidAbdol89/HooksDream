// src/components/layout/NavItems.tsx
import { Home, Search, Bell, MessageSquare, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

export const useNavItems = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { unreadCount } = useUnreadCount(user?.hashId);

  const navItems: NavItem[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: t('nav.home'),
      onClick: () => navigate('/feed')
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: t('nav.search'),
      onClick: () => navigate('/search')
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: t('nav.notifications'),
      onClick: () => console.log('Navigate to Notifications'),
      badge: unreadCount.notifications > 0 ? unreadCount.notifications : undefined
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: t('nav.messages'),
      onClick: () => navigate('/messages'),
      badge: unreadCount.messages > 0 ? unreadCount.messages : undefined
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('nav.friends'),
      onClick: () => navigate('/friend')
    }
  ];

  return navItems;
};