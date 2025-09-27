import React from 'react';
import { UserCard } from '@/components/profile/index/UserCard';
import { PostCard } from '@/components/posts/PostCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, FileText, Search } from 'lucide-react';
import { Profile } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface SearchResultsProps {
  results: any;
  type: 'all' | 'users' | 'posts';
  onUserSelect?: (user: Profile) => void;
  onPostSelect?: (post: any) => void;
  onClose?: () => void; // Callback để đóng search modal/page
  query: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  type,
  onUserSelect,
  onPostSelect,
  onClose,
  query
}) => {
  const navigate = useNavigate();

  if (!results) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nhập từ khóa để bắt đầu tìm kiếm</p>
      </div>
    );
  }

  const handleUserClick = (user: Profile) => {
    // Đóng search modal trước nếu có (không áp dụng cho SearchPage)
    if (onClose) {
      onClose();
      // Delay nhỏ để modal đóng mượt mà trước khi navigate
      setTimeout(() => {
        const userId = user._id || user.id;
        navigate(`/profile/${userId}`);
      }, 100);
    } else {
      // Direct navigation cho SearchPage
      const userId = user._id || user.id;
      navigate(`/profile/${userId}`);
    }
    
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handlePostClick = (post: any) => {
    // Đóng search modal trước nếu có (không áp dụng cho SearchPage)
    if (onClose) {
      onClose();
      // Delay nhỏ để modal đóng mượt mà trước khi navigate
      setTimeout(() => {
        navigate(`/post/${post._id}`);
      }, 100);
    } else {
      // Direct navigation cho SearchPage
      navigate(`/post/${post._id}`);
    }
    
    if (onPostSelect) {
      onPostSelect(post);
    }
  };

  // Handle follow/unfollow for users
  const handleFollowToggle = async (targetUserId: string, targetUsername: string) => {
    // This would be implemented similar to SearchUsers component
    console.log('Follow toggle:', targetUserId, targetUsername);
  };

  // Render unified results (all)
  if (type === 'all') {
    const hasUsers = results.users && results.users.length > 0;
    const hasPosts = results.posts && results.posts.length > 0;

    if (!hasUsers && !hasPosts) {
      return (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Không tìm thấy kết quả</h3>
          <p className="text-muted-foreground">
            Không có kết quả nào cho "{query}". Thử tìm kiếm với từ khóa khác.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Users Section */}
        {hasUsers && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Người dùng ({results.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.users.map((user: Profile) => (
                  <div key={user._id} onClick={() => handleUserClick(user)} className="cursor-pointer">
                    <UserCard
                      user={user}
                      onFollowToggle={handleFollowToggle}
                      showFollowButton={true}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Section */}
        {hasPosts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bài viết ({results.posts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.posts.map((post: any) => (
                  <div key={post._id} onClick={() => handlePostClick(post)} className="cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors">
                    <PostCard
                      post={post}
                      onLike={() => {}}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Render users only
  if (type === 'users') {
    const users = results.users || results;
    
    if (!users || users.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Không tìm thấy người dùng</h3>
          <p className="text-muted-foreground">
            Không có người dùng nào phù hợp với "{query}".
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2">
          {users.map((user: Profile) => (
            <div key={user._id} onClick={() => handleUserClick(user)} className="cursor-pointer">
              <UserCard
                user={user}
                onFollowToggle={handleFollowToggle}
                showFollowButton={true}
              />
            </div>
          ))}
          
          {users.length > 0 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Tìm thấy {users.length} người dùng
            </div>
          )}
        </div>
      </>
    );
  }

  // Render posts only
  if (type === 'posts') {
    const posts = results.posts || results;
    
    if (!posts || posts.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Không tìm thấy bài viết</h3>
          <p className="text-muted-foreground">
            Không có bài viết nào phù hợp với "{query}".
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post._id} onClick={() => handlePostClick(post)} className="cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors">
              <PostCard
                post={post}
                onLike={() => {}}
              />
            </div>
          ))}
          
          {posts.length > 0 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Tìm thấy {posts.length} bài viết
            </div>
          )}
        </div>
      </>
    );
  }

  return null;
};

export default SearchResults;
