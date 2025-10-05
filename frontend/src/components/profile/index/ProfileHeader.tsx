import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Edit } from 'lucide-react';
import { FollowButton } from '@/components/ui/FollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Profile } from '@/store/useAppStore';

interface ProfileHeaderProps {
  user: Profile;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  onOpenFollowers: () => void; 
  onOpenFollowing: () => void; 
  isFollowLoading?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  onEditProfile,
  onOpenFollowers,
  onOpenFollowing,
}) => {
  const navigate = useNavigate();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleMessageClick = () => {
    // Navigate to chat with this user
    navigate(`/messages?user=${user._id}`);
  };

  const handleEditProfile = () => {
    // Navigate to edit profile page
    navigate('/edit-profile');
  };

  return (
<div className="px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-t-3xl">
{/* Premium Centered Layout */}
      <div className="flex flex-col items-center max-w-sm mx-auto">
        {/* Avatar with edit button - Overlapping style like before */}
        <div className="relative -mt-20 md:-mt-16 flex justify-center mb-4">
          <div className="relative">
            <div 
              onClick={() => setIsAvatarModalOpen(true)} 
              className="cursor-pointer"
            >
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src={user.avatar} alt={user.displayName} />
                <AvatarFallback className="text-2xl">
                  {user.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Edit Profile Icon - Positioned correctly */}
            {isOwnProfile && (
              <button
                onClick={handleEditProfile}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-background border border-muted-foreground/30 rounded-full flex items-center justify-center hover:bg-muted/50 transition-all duration-200 shadow-md z-10"
              >
                <Edit className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Avatar Modal */}
        {isAvatarModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
            onClick={() => setIsAvatarModalOpen(false)}
          >
            <img
              src={user.avatar}
              alt={user.displayName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Display Name & Badges - Primary */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {user.displayName || user.username}
          </h1>
          {/* Verified badge for real users */}
          {user.isVerified && (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
        </div>
        
        {/* Special badge for bot users */}
        {user.specialBadge && (
          <div className="mb-2">
            <span 
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full text-white font-medium shadow-lg"
              style={{ backgroundColor: user.specialBadge.color }}
            >
              <span className="text-base">{user.specialBadge.icon}</span>
              <span>{user.specialBadge.label}</span>
            </span>
          </div>
        )}

        {/* Username - Subtle */}
        <p className="text-sm text-muted-foreground mb-4 text-center font-medium">
          @{user.username}
        </p>

{/* Compact Stats Row */}
<div className="flex justify-center items-center gap-6 mb-5 translate-x-2">
  <div className="text-center">
    <div className="text-lg font-bold text-foreground">
      {user.postCount || 0}
    </div>
    <div className="text-sm text-muted-foreground font-medium">Posts</div>
  </div>
  
  <button 
    onClick={onOpenFollowers}
    className="text-center hover:opacity-70 transition-all duration-200 active:scale-95"
  >
    <div className="text-lg font-bold text-foreground">
      {user.followerCount || 0}
    </div>
    <div className="text-sm text-muted-foreground font-medium">Followers</div>
  </button>
  
  <button 
    onClick={onOpenFollowing}
    className="text-center hover:opacity-70 transition-all duration-200 active:scale-95"
  >
    <div className="text-lg font-bold text-foreground">
      {user.followingCount || 0}
    </div>
    <div className="text-sm text-muted-foreground font-medium">Following</div>
  </button>
</div>


        {/* Premium Pill Buttons - Only for other profiles */}
        {!isOwnProfile && (
          <div className="flex items-center gap-3 mb-6 w-full">
            {/* Premium Follow Button */}
            <FollowButton
              userId={user._id}
              initialIsFollowing={user.isFollowing}
              initialFollowerCount={user.followerCount}
              variant="default"
              size="sm"
              username={user.username}
              className="flex-1 rounded-full h-8 px-4 text-sm font-medium"
            />

            {/* Premium Message Button */}
            <Button
              onClick={handleMessageClick}
              variant="outline"
              className="flex-1 rounded-full h-8 px-4 text-sm font-medium border-muted-foreground/20 hover:bg-muted/50 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Bio & Links - Refined */}
      <div className="max-w-sm mx-auto text-center space-y-3">
        {user.bio && (
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            {user.bio}
          </p>
        )}

        {user.website && (
          <a 
            href={user.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-sm text-blue-500 hover:text-blue-600 transition-colors font-medium"
          >
            {user.website}
          </a>
        )}
      </div>
    </div>
  );
};