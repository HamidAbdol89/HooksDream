// src/pages/FriendPage.tsx
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Crown, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PopularUsersSection } from '@/components/feed/PopularUsersSection';
import { FollowButton } from '@/components/ui/FollowButton';
import { useSocial } from '@/hooks/useSocial';
import { useChat } from '@/hooks/useChat';
import { userApi } from '@/services/api';

const FriendPage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useSocial();
  const { useDirectConversation } = useChat();

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Load tất cả users (sử dụng popular users với limit cao hơn)
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const response = await userApi.getPopularUsers();
        if (response.success) {
          setAllUsers(response.data || []);
        }
      } catch (error) {
        console.error('Load all users error:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadAllUsers();
  }, []);

  // FollowButton sẽ tự handle follow/unfollow logic
  
  // Handle click to start chat
  const handleUserClick = async (userId: string) => {
    try {
      // Navigate to messages page
      navigate('/messages');
      // TODO: Open specific conversation with this user
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Gợi ý kết bạn</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Khám phá và kết nối với những người bạn có thể quan tâm
        </p>
        
        {/* Categories info */}
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Crown className="w-3 h-3 text-amber-500" />
            <span>Tác giả</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserPlus className="w-3 h-3 text-blue-500" />
            <span>Theo dõi bạn</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3 text-green-500" />
            <span>Mới tham gia</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span>Nổi bật</span>
          </div>
        </div>
      </div>

      {/* Popular Users Section */}
      <div className="space-y-4">
        <PopularUsersSection
          popularUsers={allUsers}
          isLoading={isLoadingUsers}
        />
        
        {/* Additional sections can be added here */}
        {allUsers.length > 3 && (
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Tất cả gợi ý</h3>
            <div className="grid gap-3">
              {allUsers.slice(3).map((user: any, index: number) => (
                <div
                  key={`${user._id}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                >
                  {/* Click area for starting chat */}
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleUserClick(user._id)}
                  >
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
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
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <MessageSquare className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary">Click to chat</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FollowButton
                      userId={user._id}
                      initialIsFollowing={user.isFollowing || false}
                      variant={user.isFollowing ? "secondary" : "default"}
                      size="sm"
                      showIcon={false}
                      className="px-3 py-1.5 text-xs font-medium"
                      username={user.username || user.displayName}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendPage;
