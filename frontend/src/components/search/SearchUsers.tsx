import React, { useState, useCallback, useMemo } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserCard } from '@/components/profile/index/UserCard';
import { SearchInput } from './SearchInput';
import { userApi, api } from '@/services/api';
import { Users } from 'lucide-react';
import { Profile } from '@/store/useAppStore';

interface SearchUsersProps {
  onUserSelect?: (user: Profile) => void;
  showFollowButton?: boolean;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  success: boolean;
  data: Profile[];
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export const SearchUsers: React.FC<SearchUsersProps> = ({
  onUserSelect,
  showFollowButton = true,
  placeholder = "Tìm kiếm người dùng theo tên hoặc username...",
  className = ""
}) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());

  // Search users function
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response: SearchResult = await userApi.searchUsers({
        search: query.trim(),
        limit: 20
      });

      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
        setError('Không thể tìm kiếm người dùng');
      }
    } catch (err) {
      console.error('Search users error:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tìm kiếm');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle follow/unfollow
  const handleFollowToggle = useCallback(async (targetUserId: string, targetUsername: string) => {
    try {
      const isCurrentlyFollowing = followingUsers.has(targetUserId);
      
      // Optimistic update
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.delete(targetUserId);
        } else {
          newSet.add(targetUserId);
        }
        return newSet;
      });

      // Update users list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === targetUserId 
            ? { ...user, isFollowing: !isCurrentlyFollowing }
            : user
        )
      );

      // API call
      await api.follow.toggleFollow(targetUserId);
      
    } catch (error) {
      console.error('Follow toggle error:', error);
      
      // Revert optimistic update on error
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        const isCurrentlyFollowing = newSet.has(targetUserId);
        if (isCurrentlyFollowing) {
          newSet.delete(targetUserId);
        } else {
          newSet.add(targetUserId);
        }
        return newSet;
      });

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === targetUserId 
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    }
  }, [followingUsers]);

  // Handle user selection
  const handleUserSelect = useCallback((user: Profile) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  }, [onUserSelect]);

  // Memoized search results
  const searchResults = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-muted-foreground">Đang tìm kiếm...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-8 text-red-500">
          <span>{error}</span>
        </div>
      );
    }

    if (hasSearched && users.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mb-2 opacity-50" />
          <span>Không tìm thấy người dùng nào</span>
          <span className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</span>
        </div>
      );
    }

    if (users.length > 0) {
      return (
        <div className="space-y-2">
          {users.map((user) => (
            <div 
              key={user._id} 
              onClick={() => handleUserSelect(user)}
              className="cursor-pointer"
            >
              <UserCard
                user={user}
                onFollowToggle={handleFollowToggle}
                showFollowButton={showFollowButton}
              />
            </div>
          ))}
        </div>
      );
    }

    return null;
  }, [loading, error, hasSearched, users, handleFollowToggle, showFollowButton, handleUserSelect]);

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="mb-4">
        <SearchInput
          onSearch={handleSearch}
          placeholder={placeholder}
          className="w-full"
        />
      </div>

      {/* Search Results */}
      <div className="min-h-[200px]">
        {searchResults}
      </div>

      {/* Results Count */}
      {hasSearched && !loading && !error && users.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Tìm thấy {users.length} người dùng
        </div>
      )}
    </div>
  );
};

export default SearchUsers;
