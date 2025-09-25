import React from 'react';
import { Card } from '@/components/ui/Card';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileInfo } from './ProfileInfo';
import { ProfileActions } from './ProfileActions';
import { ProfileStats } from './ProfileStats';
import { Profile } from '@/store/useAppStore';

interface ProfileHeaderProps {
  user: Profile;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  onFollow: () => void;
  onOpenFollowers: () => void; 
  onOpenFollowing: () => void; 
  isFollowLoading?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  onEditProfile,
  onFollow,
  onOpenFollowers,
  onOpenFollowing,
}) => {
  return (
    <Card className="p-6 mb-6 shadow-lg border-0">
      <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0">
        <ProfileAvatar
          avatar={user.avatar}
          displayName={user.displayName}
        />

        <div className="flex-1 md:ml-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <ProfileInfo user={user} />
            
            {/* Always show ProfileActions - it will handle the logic internally */}
            <ProfileActions
              isOwnProfile={isOwnProfile}
              isFollowing={user.isFollowing}
              onEditProfile={onEditProfile}
              onFollow={onFollow}
            />
          </div>
        </div>
      </div>

      {user._id && (
        <ProfileStats
          postCount={user.postCount || 0}
          followerCount={user.followerCount || 0}
          followingCount={user.followingCount || 0}
          userId={user._id}
          onOpenFollowers={onOpenFollowers} 
          onOpenFollowing={onOpenFollowing} 
        />
      )}
    </Card>
  );
};