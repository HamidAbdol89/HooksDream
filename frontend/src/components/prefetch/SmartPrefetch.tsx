import React, { useEffect } from 'react';
import { usePrefetchStrategy } from '@/hooks/usePrefetchStrategy';

interface SmartPrefetchProps {
  // Prefetch profiles from posts in feed
  posts?: Array<{ userId?: { _id?: string } | string }>;
  
  // Prefetch specific user IDs
  userIds?: string[];
  
  // Prefetch popular/suggested users
  enablePopularUsers?: boolean;
  
  // Debug mode
  debug?: boolean;
}

export const SmartPrefetch: React.FC<SmartPrefetchProps> = ({
  posts = [],
  userIds = [],
  enablePopularUsers = false,
  debug = false
}) => {
  const { prefetchUsers, prefetchProfile } = usePrefetchStrategy();

  useEffect(() => {
    const prefetchFromPosts = async () => {
      // Extract user IDs from posts
      const postUserIds = posts
        .map(post => {
          if (typeof post.userId === 'string') return post.userId;
          if (post.userId && typeof post.userId === 'object') return post.userId._id;
          return null;
        })
        .filter(Boolean) as string[];

      // Combine with explicit userIds
      const allUserIds = [...new Set([...postUserIds, ...userIds])];
      
      if (allUserIds.length > 0) {
        
        await prefetchUsers(allUserIds);
      }
    };

    // Delay prefetch to not interfere with main content loading
    const timeoutId = setTimeout(prefetchFromPosts, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [posts, userIds, prefetchUsers, debug]);

  // Prefetch popular users from API
  useEffect(() => {
    if (!enablePopularUsers) return;

    const prefetchPopularUsers = async () => {
      try {
        // This would call your popular users API
        // For now, we'll skip this to avoid additional API calls
      } catch (error) {
      }
    };

    const timeoutId = setTimeout(prefetchPopularUsers, 2000);
    return () => clearTimeout(timeoutId);
  }, [enablePopularUsers, debug]);

  // This component renders nothing
  return null;
};

// ⚡ Hook to add hover prefetching to any element
export const useSmartHover = (userId: string) => {
  const { prefetchUserData } = usePrefetchStrategy();
  
  const hoverProps = {
    onMouseEnter: () => {
      // Small delay to avoid prefetching on accidental hovers
      const timeoutId = setTimeout(() => {
        prefetchUserData(userId);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };

  return hoverProps;
};

// ⚡ Component wrapper that adds hover prefetching
interface HoverPrefetchProps {
  userId: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const HoverPrefetch: React.FC<HoverPrefetchProps> = ({ 
  userId, 
  children, 
  disabled = false 
}) => {
  const hoverProps = useSmartHover(userId);
  
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div {...hoverProps} style={{ display: 'contents' }}>
      {children}
    </div>
  );
};
