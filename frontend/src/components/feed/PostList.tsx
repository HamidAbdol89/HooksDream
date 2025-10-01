// src/components/feed/PostList.tsx
import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { PostCard } from '../posts/PostCard';
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';

interface PostListProps {
  posts: Post[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onLike: (postId: string) => void;
  onFollow: (userId: string, currentStatus: boolean) => void;
  onPostUpdate?: (updatedPost: Post | null) => void; // THÊM PROP MỚI
  isFollowLoading: boolean;
  lastPostRef: (node: HTMLDivElement | null) => void;
  currentUserHashId?: string;
  currentUser?: UserProfile;
}

export const PostList: React.FC<PostListProps> = ({
  posts,
  hasMore,
  isLoadingMore,
  isRefreshing,
  onLoadMore,
  onRefresh,
  onLike,
  onFollow,
  onPostUpdate, // NHẬN PROP MỚI
  isFollowLoading,
  lastPostRef,
  currentUserHashId,
  currentUser 
}) => {
   return (
    <div className="flex flex-col gap-6">
      {posts.map((post, index) => {
        const isLastPost = index === posts.length - 1;
        
        return (
          <div
            key={post._id}
            ref={isLastPost ? lastPostRef : undefined}
          >
       <PostCard
  post={{
    ...post,
    userId: {
      ...post.userId,
      isFollowing: post.userId.isFollowing || false,
    },
    commentCount: post.commentCount || 0 // ĐẢM BẢO commentCount LUÔN CÓ GIÁ TRỊ
  }}
  onLike={() => onLike(post._id)}
  onFollow={() => onFollow(
    post.userId._id, 
    post.userId.isFollowing || false
  )}
  onPostUpdate={onPostUpdate}
  isFollowLoading={isFollowLoading}
  currentUserHashId={currentUserHashId}
  currentUser={currentUser}
/>
          </div>
        );
      })}
      
      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Đang tải thêm bài viết...</span>
          </div>
        </div>
      )}
      
      {/* End of Feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">Bạn đã xem hết tất cả bài viết!</p>
          <Button 
            variant="ghost"
            onClick={onRefresh}
            className="mt-4 text-xs"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới để xem bài viết mới
          </Button>
        </div>
      )}
    </div>
  );
};