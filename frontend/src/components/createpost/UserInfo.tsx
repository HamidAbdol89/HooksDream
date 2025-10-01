// src/components/createpost/UserInfo.tsx
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { useTranslation } from 'react-i18next';

interface UserInfoProps {
  profile: any;
}

export const UserInfo: React.FC<UserInfoProps> = ({ profile }) => {
  const { t } = useTranslation('common');

  if (!profile) {
    return (
      <div className="flex items-start space-x-3 pb-4 border-b">
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarFallback>
            {t('common.userInitial')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-base leading-none truncate">
            {t('common.loading')}...
          </p>
          <p className="text-muted-foreground text-sm truncate mt-1">
            {t('common.loadingProfile')}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 pb-4 border-b">
      <Avatar className="w-12 h-12 flex-shrink-0">
        <AvatarImage 
          src={profile.avatar || ''} 
          alt={profile.displayName || profile.username || t('common.user')} 
        />
        <AvatarFallback>
          {(profile.displayName || profile.username || t('common.userInitial'))[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base leading-none truncate">
          {profile.displayName || profile.username || t('common.user')}
        </p>
        <p className="text-muted-foreground text-sm truncate mt-1">
          {profile.username && profile.displayName !== profile.username 
            ? `@${profile.username}` 
            : (profile.email || '')
          }
        </p>
      </div>
    </div>
  );
};
