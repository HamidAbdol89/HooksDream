// src/components/layout/NavItems.tsx
import { Home, Search, Bell, MessageSquare, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const useNavItems = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

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
      onClick: () => console.log('Navigate to Notifications')
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: t('nav.messages'),
      onClick: () => navigate('/messages')
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t('nav.friends'),
      onClick: () => navigate('/friend')
    }
  ];

  return navItems;
};