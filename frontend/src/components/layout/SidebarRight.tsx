import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '@/hooks/useSocial';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { FollowButton } from '@/components/ui/FollowButton';

export const SidebarRight: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUserId,
    useCurrentProfile
  } = useSocial();

  // Get current user profile để có userId
  const { data: currentUserData } = useCurrentProfile();
  const actualUserId = currentUserId || currentUserData?.data?._id;
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const token = localStorage.getItem('user_hash_id') || '';

  // Load những người đã follow (sử dụng cách tương tự FollowerListModal)
  const { data: followingData, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', actualUserId],
    queryFn: async () => {
      if (!actualUserId || !token) return [];
      
      
      const response = await fetch(`${API_BASE_URL}/api/users/${actualUserId}/following?limit=5`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('❌ Following fetch failed:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data || [];
    },
    enabled: !!actualUserId && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  const followingUsers = followingData || [];



  // FollowButton sẽ tự handle follow/unfollow logic

  // Nếu không có userId, hiển thị loading
  if (!actualUserId) {
    return (
      <div className="h-full p-3 space-y-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-muted-foreground mt-2">Đang tải...</p>
          </div>
        </div>
        
        {/* Footer Links */}
        <div className="text-xs text-muted-foreground flex flex-wrap gap-2 px-1">
          <span className="hover:text-primary cursor-pointer">Trợ giúp</span>
          <span className="hover:text-primary cursor-pointer">Quyền riêng tư</span>
          <span className="hover:text-primary cursor-pointer">Điều khoản</span>
          <span className="hover:text-primary cursor-pointer">© 2024</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-3 space-y-4">
      {/* Following Users Section */}
      <div className="bg-card border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm text-foreground">Đang theo dõi</h3>
          <span className="text-xs text-muted-foreground">({followingUsers.length})</span>
        </div>
        
        {isLoadingFollowing ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : followingUsers.length > 0 ? (
          <div className="space-y-2">
            {followingUsers.slice(0, 5).map((user: any) => (
              <div key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback className="text-xs">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
                <FollowButton
                  userId={user._id}
                  initialIsFollowing={true}
                  variant="secondary"
                  size="sm"
                  showIcon={false}
                  className="text-xs px-2 py-1 h-6"
                  username={user.username || user.displayName}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            Chưa theo dõi ai
          </p>
        )}
        
        {/* Link to Friend Page */}
        <div className="mt-3 pt-2 border-t">
          <button
            onClick={() => navigate('/friend')}
            className="w-full text-xs text-primary hover:text-primary/80 font-medium py-1"
          >
            Xem gợi ý kết bạn
          </button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="text-xs text-muted-foreground flex flex-wrap gap-2 px-1">
        <span className="hover:text-primary cursor-pointer">Trợ giúp</span>
        <span className="hover:text-primary cursor-pointer">Quyền riêng tư</span>
        <span className="hover:text-primary cursor-pointer">Điều khoản</span>
        <span className="hover:text-primary cursor-pointer">© 2024</span>
      </div>
    </div>
  );
};