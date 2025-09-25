import { useState, useEffect, useCallback } from 'react';
import { api, userApi } from '@/services/api';
import { User, Profile, Post, convertUserToProfile, mergeUserWithCloudinaryPriority, NewPostInput } from '@/store/useAppStore';



export const useProfile = (userId: string, currentUserId?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const isOwnProfile = currentUserId === userId;

  const refetchProfile = async () => {
    try {
      const response = await userApi.getProfile(userId);
      if (response.success && response.data) {
        // ✅ Sử dụng Cloudinary priority merge
        const userData = mergeUserWithCloudinaryPriority(response.data);
        const profileData = convertUserToProfile(userData);
        
        setUser(userData);
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error refetching profile:', err);
    }
  };

  // Load user profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.getProfile(userId);
      
      if (response.success && response.data) {
        // ✅ Sử dụng Cloudinary priority merge
        const userData = mergeUserWithCloudinaryPriority(response.data);
        const profileData = convertUserToProfile(userData);
        
        setUser(userData);
        setProfile(profileData);
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load user posts với infinite scroll
  const loadPosts = async (page = 1, limit = 10, loadMore = false) => {
    if (postsLoading && loadMore) return; // Ngăn chặn gọi nhiều lần
    
    try {
      setPostsLoading(true);
      
      // Nếu là trang đầu tiên, reset state
      if (page === 1) {
        setHasMorePosts(true);
        setCurrentPage(1);
      }
      
      const response = await api.post.getUserPosts(userId, { page, limit });
      
      if (response.success) {
        const newPosts = response.data || [];
        
        // Kiểm tra nếu còn dữ liệu để load
        if (newPosts.length < limit) {
          setHasMorePosts(false);
        }
        
        if (page === 1) {
          // Reset toàn bộ posts khi load trang đầu
          setPosts(newPosts);
          
          // Filter media posts (cả images và video)
          const mediaPostsFiltered = newPosts.filter((post: Post) => 
            (post.images && post.images.length > 0) || post.video
          );
          setMediaPosts(mediaPostsFiltered);
          
          // Filter liked posts
          const likedPostsFiltered = newPosts.filter((post: Post) => post.isLiked);
          setLikedPosts(likedPostsFiltered);
        } else {
          // Thêm posts mới vào cuối danh sách
          setPosts(prev => [...prev, ...newPosts]);
          
          // Thêm media posts mới (cả images và video)
          const mediaPostsFiltered = newPosts.filter((post: Post) => 
            (post.images && post.images.length > 0) || post.video
          );
          setMediaPosts(prev => [...prev, ...mediaPostsFiltered]);
          
          // Thêm liked posts mới
          const likedPostsFiltered = newPosts.filter((post: Post) => post.isLiked);
          setLikedPosts(prev => [...prev, ...likedPostsFiltered]);
        }
        
        setCurrentPage(page);
      } else {
      }
    } catch (err) {
      setHasMorePosts(false);
    } finally {
      setPostsLoading(false);
    }
  };

  // Hàm để load thêm posts (dùng cho infinite scroll)
  const loadMorePosts = useCallback(async () => {
    if (!hasMorePosts || postsLoading) return;
    
    await loadPosts(currentPage + 1, 10, true);
  }, [currentPage, hasMorePosts, postsLoading, userId]);

  // Hàm refresh để reset và load lại từ đầu
  const refreshPosts = useCallback(async () => {
    await loadPosts(1, 10);
  }, [userId]);

  // Update profile
  const updateProfile = async (updateData: Partial<User>) => {
    try {
      const response = await userApi.updateProfile(userId, updateData);
      
      if (response.success && response.data) {
        // ✅ Sử dụng Cloudinary priority merge
        const userData = mergeUserWithCloudinaryPriority(response.data);
        const profileData = convertUserToProfile(userData);
        
        setUser(prev => prev ? { ...prev, ...userData } : null);
        setProfile(prev => prev ? { ...prev, ...profileData } : null);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      throw err;
    }
  };

  // Follow/Unfollow user
  const toggleFollow = async () => {
    if (!user || isOwnProfile) return;
    
    try {
      // Call new follow API endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle follow');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUser(prev => prev ? {
          ...prev,
          isFollowing: result.data.isFollowing,
          followerCount: result.data.followerCount
        } : null);
        
        setProfile(prev => prev ? {
          ...prev,
          isFollowing: result.data.isFollowing,
          followerCount: result.data.followerCount
        } : null);
      }
      
    } catch (err) {
      // Revert UI change if error occurred
      setUser(prev => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followerCount: prev.isFollowing ? prev.followerCount + 1 : prev.followerCount - 1
      } : null);
      
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followerCount: prev.isFollowing ? prev.followerCount + 1 : prev.followerCount - 1
      } : null);
      
      throw err;
    }
  };

  // Like/Unlike post
  const togglePostLike = async (postId: string) => {
    try {
      const response = await api.post.likePost(postId);
      
      if (response.success) {
        const updatePostInArray = (posts: Post[]) =>
          posts.map(post =>
            post._id === postId
              ? {
                  ...post,
                  isLiked: response.data.isLiked,
                  likeCount: response.data.likeCount
                }
              : post
          );

        setPosts(updatePostInArray);
        setMediaPosts(updatePostInArray);
        setLikedPosts(updatePostInArray);
      }
    } catch (err) {
      throw err;
    }
  };

  // Delete post
  const deletePost = async (postId: string) => {
    try {
      const response = await api.post.deletePost(postId);
      
      if (response.success) {
        const removePostFromArray = (posts: Post[]) =>
          posts.filter(post => post._id !== postId);

        setPosts(removePostFromArray);
        setMediaPosts(removePostFromArray);
        setLikedPosts(removePostFromArray);

        // Update post count
        if (user && profile) {
          setUser(prev => prev ? {
            ...prev,
            postCount: Math.max(0, prev.postCount - 1)
          } : null);
          
          setProfile(prev => prev ? {
            ...prev,
            postCount: Math.max(0, prev.postCount - 1)
          } : null);
        }
      } else {
        throw new Error(response.message || 'Failed to delete post');
      }
    } catch (err) {
      throw err;
    }
  };

  // Add new post to the beginning of the list
  const addNewPost = (input: NewPostInput) => {
    const newPost: Post = {
      _id: crypto.randomUUID(),
      userId: {
        _id: user?._id || '',
        username: user?.username || '',
        displayName: user?.displayName || '',
        avatar: user?.avatar || '',
        isVerified: user?.isVerified,
      },
      content: input.content,
      images: input.images,
      video: input.video,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isLiked: false,
    };

    setPosts(prev => [newPost, ...prev]);

    // Thêm vào mediaPosts nếu có images HOẶC video
    if ((newPost.images && newPost.images.length > 0) || newPost.video) {
      setMediaPosts(prev => [newPost, ...prev]);
    }

    if (user && profile) {
      setUser(prev => prev ? { ...prev, postCount: (prev.postCount || 0) + 1 } : null);
      setProfile(prev => prev ? { ...prev, postCount: (prev.postCount || 0) + 1 } : null);
    }
  };

  // Update avatar
  const updateAvatar = async (avatarUrl: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${userId}/avatar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: avatarUrl })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setUser(prev => prev ? { ...prev, avatar: result.data.avatar } : null);
        setProfile(prev => prev ? { ...prev, avatar: result.data.avatar } : null);
      }
      
    } catch (err) {
      throw err;
    }
  };

  // Update cover image
  const updateCoverImage = async (coverImageUrl: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${userId}/cover`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coverImage: coverImageUrl })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update cover image');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setUser(prev => prev ? { ...prev, coverImage: result.data.coverImage } : null);
        setProfile(prev => prev ? { ...prev, coverImage: result.data.coverImage } : null);
      }
      
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadPosts(1, 10); // Luôn bắt đầu từ trang 1
    }
  }, [userId]);

  return {
    user,
    profile, // ✅ Thêm profile để tương thích với useAppStore
    posts,
    mediaPosts,
    likedPosts,
    loading,
    postsLoading,
    error,
    isOwnProfile,
    hasMorePosts,
    currentPage,
    
    // Actions
    loadProfile,
    loadPosts,
    loadMorePosts,
    refreshPosts,
    updateProfile,
    toggleFollow,
    togglePostLike,
    deletePost,
    addNewPost,
    updateAvatar,
    updateCoverImage,
    refetchProfile,
    
    // Utilities
    refresh: () => {
      loadProfile();
      refreshPosts();
    }
  };
};