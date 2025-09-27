// src/components/posts/PostFeed.tsx - Example usage
import React, { useCallback } from 'react';
import { PostCard } from './PostCard';
import { PerformanceWrapper } from './PerformanceWrapper';
import { useAppPerformance } from '@/hooks/useAppPerformance';
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
  const { trackInteraction, trackAPICall } = useAppPerformance();

  const handleLike = useCallback(async (postId: string) => {
    const interactionStart = performance.now();
    
    try {
      // Track user interaction
      await onLike(postId);
      
      const interactionTime = performance.now() - interactionStart;
      trackInteraction('post-like', interactionTime);
      
    } catch (error) {
      console.error('Like failed:', error);
    }
  }, [onLike, trackInteraction]);

  const handleComment = useCallback((postId: string) => {
    const interactionStart = performance.now();
    
    onComment?.(postId);
    
    const interactionTime = performance.now() - interactionStart;
    trackInteraction('post-comment', interactionTime);
  }, [onComment, trackInteraction]);

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <PerformanceWrapper 
          key={post._id} 
          componentName={`PostCard-${index}`}
          trackRender={index < 5} // Chỉ track 5 post đầu tiên
        >
          <PostCard
            post={post}
            onLike={() => handleLike(post._id)}
            onComment={() => handleComment(post._id)}
            onShare={() => onShare?.(post._id)}
          />
        </PerformanceWrapper>
      ))}
    </div>
  );
};
