// src/pages/Feed.tsx - OPTIMIZED FOR MOBILE
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useSocial } from '@/hooks/useSocial';
import { api, userApi } from '@/services/api';
import { FeedContainer } from '@/components/feed/Feed';
import { Post } from '@/types/post';
import { useTranslation } from 'react-i18next';

export const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isConnected, profile } = useGoogleAuth();
  const { useCurrentProfile, prefetchProfile, toggleFollow, isFollowLoading } = useSocial();
  const { data: currentProfileData, isLoading: isCurrentProfileLoading } = useCurrentProfile();
  const currentUserProfile = currentProfileData?.data;
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [isLoadingPopularUsers, setIsLoadingPopularUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { t } = useTranslation('common');
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 Optimized load posts - Bỏ API call cho mỗi post
  const loadPosts = async (resetData = false) => {
    try {
      setError(null);
      if (resetData) {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      }
      
      // 🔥 Set timeout để tránh loading vô tận trên mobile
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Loading timeout - force stop loading');
          setLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
      }, 15000); // 15s timeout
      
      const response = await api.post.getPosts({ 
        page: resetData ? 1 : currentPage, 
        limit: 10, 
        sort: 'latest' 
      });
      
      if (response.success) {
        const newPosts = response.data;
        
        // 🔥 Chỉ prefetch, không await - Tránh blocking
        newPosts.forEach((post: Post) => {
          if (post.userId?._id) {
            prefetchProfile(post.userId._id);
          }
        });

        // 🔥 BỎ phần fetch follow status cho từng post - quá nặng cho mobile
        // Thay vào đó, sẽ lazy load khi user scroll đến
        
        if (resetData) {
          setPosts(newPosts);
        } else {
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(p => p._id));
            const uniqueNewPosts = newPosts.filter((post: Post) => !existingIds.has(post._id));
            return [...prevPosts, ...uniqueNewPosts];
          });
        }
        
        setHasMore(newPosts.length === 10);
        
        if (!resetData) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        setError(response.message || t('feed.error.loading'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('feed.error.loading'));
      console.error('Load posts error:', err);
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // 🔥 Debounced load popular users - Tránh multiple calls
  const loadPopularUsers = useCallback(async () => {
    if (isLoadingPopularUsers) return; // Tránh duplicate calls
    
    try {
      setIsLoadingPopularUsers(true);
      const response = await userApi.getPopularUsers();
      
      if (response.success) {
        setPopularUsers(response.data || []);
      } else {
        console.error('Failed to load popular users:', response.message);
      }
    } catch (err) {
      console.error('Load popular users error:', err);
    } finally {
      setIsLoadingPopularUsers(false);
    }
  }, [isLoadingPopularUsers]);

  // 🔥 Optimized load more with throttling
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || loading) return;
    
    console.log('🔄 Loading more posts, page:', currentPage);
    setIsLoadingMore(true);
    
    try {
      const response = await api.post.getPosts({ 
        page: currentPage, 
        limit: 10, 
        sort: 'latest' 
      });
      
      if (response.success) {
        const newPosts = response.data;
        
        // 🔥 Background prefetch - không blocking
        newPosts.forEach((post: Post) => {
          if (post.userId?._id) {
            prefetchProfile(post.userId._id);
          }
        });
        
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => p._id));
          const uniqueNewPosts = newPosts.filter((post: Post) => !existingIds.has(post._id));
          return [...prevPosts, ...uniqueNewPosts];
        });
        
        setHasMore(newPosts.length === 10);
        setCurrentPage(prev => prev + 1);
        
        console.log(`✅ Loaded ${newPosts.length} more posts`);
      } else {
        console.error('❌ Load more failed:', response.message);
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Load more error:', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, loading, prefetchProfile]);

  // 🔥 Chỉ load một lần khi mount
  useEffect(() => {
    let mounted = true;
    
    const initializeFeed = async () => {
      if (!mounted) return;
      
      try {
        // Load posts trước - quan trọng nhất
        await loadPosts(true);
        
        // Load popular users sau - không quan trọng lắm
        if (mounted) {
          setTimeout(() => {
            if (mounted) loadPopularUsers();
          }, 1000); // Delay 1s để posts load xong
        }
      } catch (err) {
        console.error('Initialize feed error:', err);
        if (mounted) {
          setLoading(false);
          setError('Failed to load feed');
        }
      }
    };

    initializeFeed();
    
    return () => {
      mounted = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []); // 🔥 Empty dependency array - chỉ chạy một lần

  // 🔥 Enhanced like handler with optimistic updates
  const handleLike = async (postId: string) => {
    if (!isConnected) return;
    
    // Optimistic update
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
            }
          : post
      )
    );
    
    try {
      const response = await api.post.toggleLike(postId);
      
      if (response.success) {
        // Update with real data
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  isLiked: response.data.isLiked,
                  likeCount: response.data.likeCount 
                }
              : post
          )
        );
      } else {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId 
              ? { 
                  ...post, 
                  isLiked: !post.isLiked,
                  likeCount: post.isLiked ? post.likeCount + 1 : post.likeCount - 1
                }
              : post
          )
        );
      }
    } catch (err) {
      console.error('Like error:', err);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likeCount: post.isLiked ? post.likeCount + 1 : post.likeCount - 1
              }
            : post
        )
      );
    }
  };

  // 🔥 Enhanced follow handler with optimistic updates
  const handleFollowUser = async (userId: string, currentStatus: boolean) => {
    if (!isConnected || isFollowLoading) return;
    
    // Optimistic update
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.userId._id === userId 
          ? { 
              ...post, 
              userId: {
                ...post.userId,
                isFollowing: !currentStatus
              }
            }
          : post
      )
    );
    
    setPopularUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId 
          ? { 
              ...user, 
              isFollowing: !currentStatus
            }
          : user
      )
    );
    
    try {
      await toggleFollow(userId, currentStatus);
    } catch (err) {
      console.error('Follow error:', err);
      
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.userId._id === userId 
            ? { 
                ...post, 
                userId: {
                  ...post.userId,
                  isFollowing: currentStatus
                }
              }
            : post
        )
      );
      
      setPopularUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { 
                ...user, 
                isFollowing: currentStatus
              }
            : user
        )
      );
    }
  };

  const handlePostCreated = useCallback((newPost: any) => {
    console.log('🔄 New post created:', newPost);
    setPosts(prevPosts => [newPost, ...prevPosts]);
  }, []);

  // 🔥 Throttled refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await loadPosts(true);
      // Load popular users trong background
      setTimeout(() => loadPopularUsers(), 500);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [isRefreshing]);

  const currentUserHashId = localStorage.getItem('user_hash_id') || undefined;

  const handlePostUpdate = useCallback((updatedPost: Post) => {
    setPosts(prev => prev.map(p => 
      p._id === updatedPost._id 
        ? { ...p, ...updatedPost }
        : p
    ));
  }, []);

  return (
    <FeedContainer
      currentUserHashId={currentUserHashId} 
      posts={posts}
      loading={loading || isCurrentProfileLoading}
      error={error}
      isRefreshing={isRefreshing}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      popularUsers={popularUsers}
      isLoadingPopularUsers={isLoadingPopularUsers}
      currentUserProfile={currentUserProfile}
      onRefresh={handleRefresh}
      onLoadMore={loadMorePosts}
      onLike={handleLike}
      onFollow={handleFollowUser}
      onPostCreated={handlePostCreated}
      onPostUpdate={handlePostUpdate}
      profile={profile}
      isConnected={isConnected}
    />
  );
};