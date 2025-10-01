import React from 'react';
import { PostCard } from '@/components/profile/index/PostCard';
import { Post, Profile } from '@/store/useAppStore';

interface PostWithRepostProps {
  post: Post;
  author: Profile;
  isOwnProfile: boolean;
  onLike: (postId: string) => void;
  onSave?: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onPostUpdate?: (updatedPost: Post | null) => void;
}

export const PostWithRepost: React.FC<PostWithRepostProps> = ({
  post,
  author,
  isOwnProfile,
  onLike,
  onSave,
  onDelete,
  onComment,
  onShare,
  onRepost,
  onPostUpdate
}) => {
  const handleRepostSuccess = (repost: Post) => {
    // Update the original post's repost count
    const updatedPost = {
      ...post,
      repostCount: (post.repostCount || 0) + 1
    };
    
    onPostUpdate?.(updatedPost);
  };

  return (
    <PostCard
      post={post}
      author={author}
      isOwnProfile={isOwnProfile}
      onLike={onLike}
      onSave={onSave}
      onDelete={onDelete}
      onComment={onComment}
      onShare={onShare}
      onRepost={onRepost}
    />
  );
};
