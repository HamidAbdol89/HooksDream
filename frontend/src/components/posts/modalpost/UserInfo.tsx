import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { useTranslation } from 'react-i18next';
interface UserInfoProps {
  profile: any;
  isMobile: boolean;
}

export const UserInfo: React.FC<UserInfoProps> = ({
  profile,
  isMobile
}) => {
  const { t } = useTranslation('common');

  if (!profile) {
    return (
      <div className={`flex items-start space-x-3 border-b ${isMobile ? 'py-3' : 'py-4'}`}>
        <Avatar className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
          <AvatarFallback>
            {t('common.userInitial')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={`font-medium leading-none truncate ${isMobile ? 'text-sm' : 'text-sm'}`}>
            {t('common.loading')}...
          </p>
          <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {t('common.loadingProfile')}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 border-b ${isMobile ? 'py-3' : 'py-4'}`}>
      <Avatar className={`flex-shrink-0 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`}>
        <AvatarImage 
          src={profile.avatar || ''} 
          alt={profile.displayName || profile.username || t('common.user')} 
        />
        <AvatarFallback>
          {(profile.displayName || profile.username || t('common.userInitial'))[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-none truncate ${isMobile ? 'text-sm' : 'text-sm'}`}>
          {profile.displayName || profile.username || t('common.user')}
        </p>
        <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {profile.username && profile.displayName !== profile.username 
            ? `@${profile.username}` 
            : (profile.email || '')
          }
        </p>
      </div>
    </div>
  );
};