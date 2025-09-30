// src/components/posts/PostFeed.tsx - Clean version
import React, { useCallback } from 'react';
import { PostCard } from './PostCard';
import { Post } from '@/types/post';

interface PostFeedProps {
  posts: Post[];
  onLike: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostFeed: React.FC<PostFeedProps> = ({
  posts,
  onLike,
  onComment,
  onShare
}) => {
  const handleLike = useCallback(async (postId: string) => {
    try {
      await onLike(postId);
    } catch (error) {
      console.error('Like failed:', error);
    }
  }, [onLike]);

  const handleComment = useCallback((postId: string) => {
    onComment?.(postId);
  }, [onComment]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          onLike={() => handleLike(post._id)}
          onComment={() => handleComment(post._id)}
          onShare={() => onShare?.(post._id)}
        />
      ))}
    </div>
  );
};
