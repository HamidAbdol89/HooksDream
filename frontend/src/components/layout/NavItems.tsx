// src/components/layout/NavItems.tsx
import { Home, Search, Bell, MessageSquare, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const useNavItems = (onSearchClick?: () => void) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const navItems: NavItem[] = [
   {
    icon: <Home className="w-5 h-5" />,
    label: t('nav.home'),
    onClick: () => navigate('/feed') // chuyển page
  },
    {
      icon: <Search className="w-5 h-5" />,
      label: t('nav.search'),
      onClick: onSearchClick || (() => console.log('Navigate to Search'))
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: t('nav.notifications'),
      onClick: () => console.log('Navigate to Notifications')
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: t('nav.messages'),
      onClick: () => console.log('Navigate to Messages')
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('nav.friends'),
      onClick: () => console.log('Navigate to Friends')
    }
  ];

  return navItems;
};