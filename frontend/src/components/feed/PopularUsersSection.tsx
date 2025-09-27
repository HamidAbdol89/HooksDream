// src/components/feed/PopularUsersSection.tsx
import React from 'react';
import { User, Loader2, Users, Crown, UserPlus, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { FollowButton } from '../ui/FollowButton';
import { UserProfile } from '@/hooks/useSocial';

interface SuggestedUser extends UserProfile {
  suggestionType?: 'creator' | 'follows_you' | 'new_user' | 'popular';
}

interface PopularUsersSectionProps {
  popularUsers: SuggestedUser[];
  isLoading: boolean;
}

export const PopularUsersSection: React.FC<PopularUsersSectionProps> = ({
  popularUsers,
  isLoading
}) => {
  // Lọc ra user không phải mình và chưa follow
  const filteredUsers = popularUsers.filter(user =>
    !user.isOwnProfile && !user.isFollowing
  );

  // Lọc trùng _id để tránh React warning
  const uniqueUsers = Array.from(
    new Map(filteredUsers.map(u => [u._id, u])).values()
  );

  // FollowButton sẽ tự handle follow/unfollow logic

  const getSuggestionConfig = (suggestionType: string) => {
    switch (suggestionType) {
      case 'creator':
        return {
          icon: Crown,
          label: 'Tác giả',
          textColor: 'text-amber-600 dark:text-amber-400',
          buttonVariant: 'default' as const
        };
      case 'follows_you':
        return {
          icon: UserPlus,
          label: 'Theo dõi bạn',
          textColor: 'text-blue-600 dark:text-blue-400',
          buttonVariant: 'secondary' as const
        };
      case 'new_user':
        return {
          icon: Clock,
          label: 'Mới tham gia',
          textColor: 'text-green-600 dark:text-green-400',
          buttonVariant: 'outline' as const
        };
      case 'popular':
        return {
          icon: TrendingUp,
          label: 'Nổi bật',
          textColor: 'text-purple-600 dark:text-purple-400',
          buttonVariant: 'outline' as const
        };
      default:
        return {
          icon: User,
          label: 'Gợi ý',
          textColor: 'text-muted-foreground',
          buttonVariant: 'outline' as const
        };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border rounded-2xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-xs text-foreground">Gợi ý kết bạn</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (uniqueUsers.length === 0) {
    return (
      <div className="bg-card border rounded-2xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-xs text-foreground">Gợi ý kết bạn</h3>
        </div>
        <div className="text-center py-4">
          <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Không có gợi ý nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-3 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-foreground">Gợi ý kết bạn</h3>
      </div>

      <div className="space-y-3">
        {uniqueUsers.slice(0, 3).map((user, index) => {
          const config = getSuggestionConfig(user.suggestionType || 'popular');
          const IconComponent = config.icon;

          return (
            <div
              key={`${user._id}-${index}`} // đảm bảo key unique
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="w-7 h-7 rounded-full">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="text-xs font-medium">
                      {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.suggestionType === 'creator' && (
                    <Crown className="w-3 h-3 text-amber-500 absolute -top-0.5 -right-0.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.displayName || user.username}
                    </p>
                    {user.suggestionType === 'creator' && (
                      <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    <IconComponent className={`w-3 h-3 ${config.textColor}`} />
                    <span className={`text-xs ${config.textColor}`}>{config.label}</span>
                  </div>
                </div>
              </div>

              <FollowButton
                userId={user._id}
                initialIsFollowing={user.isFollowing || false}
                variant={config.buttonVariant}
                size="sm"
                showIcon={false}
                className="h-7 px-3 text-xs ml-2"
                username={user.username || user.displayName}
              />
            </div>
          );
        })}
      </div>

      {/* Show all link */}
      {uniqueUsers.length > 3 && (
        <div className="mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground rounded-full"
          >
            Xem tất cả ({uniqueUsers.length})
          </Button>
        </div>
      )}
    </div>
  );
}
