// hooks/useFeedMediaCache.ts - Media Caching for Feed Performance
import { useEffect, useCallback } from 'react';
import { useImagePreloader } from '@/components/feed/CachedImage';
import { useVideoCache } from '@/components/feed/CachedVideo';
import { Post } from '@/types/post';

interface UseFeedMediaCacheOptions {
  preloadNextPage?: boolean;
  preloadImages?: boolean;
  preloadVideos?: boolean;
  maxPreloadItems?: number;
}

export const useFeedMediaCache = (
  posts: Post[], 
  options: UseFeedMediaCacheOptions = {}
) => {
  const {
    preloadNextPage = true,
    preloadImages = true,
    preloadVideos = true,
    maxPreloadItems = 20
  } = options;

  const { preloadImages: preloadImageUrls, getCacheStats: getImageCacheStats } = useImagePreloader();
  const { preloadVideoMetadata, getVideoCacheStats } = useVideoCache();

  // Extract all media URLs from posts
  const extractMediaUrls = useCallback((postsToProcess: Post[]) => {
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    postsToProcess.slice(0, maxPreloadItems).forEach(post => {
      // Collect image URLs
      if (post.images && post.images.length > 0) {
        imageUrls.push(...post.images);
      }

      // Collect video URLs
      if (post.video) {
        videoUrls.push(post.video);
      }
    });

    return { imageUrls, videoUrls };
  }, [maxPreloadItems]);

  // Preload media when posts change
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const { imageUrls, videoUrls } = extractMediaUrls(posts);

    // Preload images
    if (preloadImages && imageUrls.length > 0) {
      preloadImageUrls(imageUrls);
    }

    // Preload video metadata
    if (preloadVideos && videoUrls.length > 0) {
      preloadVideoMetadata(videoUrls);
    }
  }, [posts, extractMediaUrls, preloadImages, preloadVideos, preloadImageUrls, preloadVideoMetadata]);

  // Smart preloading for visible posts
  const preloadVisibleMedia = useCallback((visiblePostIds: string[]) => {
    const visiblePosts = posts.filter(post => visiblePostIds.includes(post._id));
    const { imageUrls, videoUrls } = extractMediaUrls(visiblePosts);

    if (preloadImages && imageUrls.length > 0) {
      preloadImageUrls(imageUrls);
    }

    if (preloadVideos && videoUrls.length > 0) {
      preloadVideoMetadata(videoUrls);
    }
  }, [posts, extractMediaUrls, preloadImages, preloadVideos, preloadImageUrls, preloadVideoMetadata]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const imageStats = getImageCacheStats();
    const videoStats = getVideoCacheStats();

    return {
      images: imageStats,
      videos: videoStats,
      totalCached: imageStats.loadedImages + videoStats.cachedVideos
    };
  }, [getImageCacheStats, getVideoCacheStats]);

  // Preload next batch of posts (for infinite scroll)
  const preloadNextBatch = useCallback((nextPosts: Post[]) => {
    if (!preloadNextPage || !nextPosts || nextPosts.length === 0) return;

    const { imageUrls, videoUrls } = extractMediaUrls(nextPosts);

    // Preload with lower priority (setTimeout to not block main thread)
    setTimeout(() => {
      if (preloadImages && imageUrls.length > 0) {
        preloadImageUrls(imageUrls.slice(0, 10)); // Limit to first 10 for performance
      }

      if (preloadVideos && videoUrls.length > 0) {
        preloadVideoMetadata(videoUrls.slice(0, 5)); // Limit to first 5 videos
      }
    }, 1000); // Delay to not interfere with current page
  }, [preloadNextPage, extractMediaUrls, preloadImages, preloadVideos, preloadImageUrls, preloadVideoMetadata]);

  return {
    preloadVisibleMedia,
    preloadNextBatch,
    getCacheStats
  };
};

// Hook for feed performance monitoring
export const useFeedPerformance = () => {
  const startTime = useCallback(() => performance.now(), []);
  
  const measureRenderTime = useCallback((startTime: number, label: string = 'Feed render') => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${label}: ${renderTime.toFixed(2)}ms`);
    }
    
    return renderTime;
  }, []);

  const measureMediaLoadTime = useCallback((mediaUrl: string, startTime: number) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📸 Media loaded (${mediaUrl.split('/').pop()}): ${loadTime.toFixed(2)}ms`);
    }
    
    return loadTime;
  }, []);

  return {
    startTime,
    measureRenderTime,
    measureMediaLoadTime
  };
};

export default useFeedMediaCache;
