const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development'
    ? 'http://localhost:5000'
    : 'https://just-solace-production.up.railway.app');

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

// Request queue to prevent spam
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 100;

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minInterval) {
            await this.delay(this.minInterval - timeSinceLastRequest);
          }
          
          const result = await requestFn();
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const requestFn = this.queue.shift()!;
      await requestFn();
      await this.delay(50);
    }
    
    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const requestQueue = new RequestQueue();

// Retry logic with exponential backoff
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = RATE_LIMIT_CONFIG.maxRetries
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      if (!error.message?.includes('429') && !error.message?.includes('Too Many Requests')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = Math.min(
        RATE_LIMIT_CONFIG.baseDelay * Math.pow(RATE_LIMIT_CONFIG.backoffMultiplier, attempt),
        RATE_LIMIT_CONFIG.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Auth headers helper - Standardized to use auth_token
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// FormData auth headers helper - Standardized to use auth_token
const getAuthHeadersForFormData = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Main API call function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  return retryRequest(async () => {
    return requestQueue.add(async () => {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = {
        ...getAuthHeaders(),
        ...options.headers,
      };
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        }
        
        if (response.status === 429) {
          throw new Error('429 Too Many Requests');
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    });
  });
};

// FormData upload function
const apiFormDataCall = async (endpoint: string, formData: FormData, method: string = 'POST') => {
  return retryRequest(async () => {
    return requestQueue.add(async () => {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeadersForFormData(),
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { message: errorText };
        }
        
        if (response.status === 429) {
          throw new Error('429 Too Many Requests - Upload rate limited');
        }
        
        throw new Error(
          errorData?.message || 
          errorData?.error || 
          `Upload failed (${response.status})`
        );
      }

      return await response.json();
    });
  });
};

// Login debouncing
let loginDebounceTimer: NodeJS.Timeout | null = null;
const debouncedLogin = (loginFn: () => Promise<any>, delay = 2000): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (loginDebounceTimer) {
      clearTimeout(loginDebounceTimer);
    }
    
    loginDebounceTimer = setTimeout(async () => {
      try {
        const result = await loginFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
};

// Image resize utility
const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// User API
export const userApi = {
  login: async (userData: { hashId: string; email: string; name: string; avatar?: string }) => {
    return debouncedLogin(() => apiCall('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(userData),
    }));
  },

  getPopularUsers: async () => {
    return apiCall('/api/users/popular');
  },

  // Enhanced Friend Discovery APIs
  getRecommendedUsers: async (limit = 10) => {
    return apiCall(`/api/discovery/recommended?limit=${limit}`);
  },

  getNearbyUsers: async (radius = 50, lat?: number, lng?: number, limit = 15) => {
    const params = new URLSearchParams({
      radius: radius.toString(),
      limit: limit.toString()
    });
    
    if (lat && lng) {
      params.append('lat', lat.toString());
      params.append('lng', lng.toString());
    }
    
    return apiCall(`/api/discovery/nearby?${params.toString()}`);
  },

  getNewUsers: async (limit = 20, days = 30) => {
    return apiCall(`/api/discovery/new?limit=${limit}&days=${days}`);
  },

  getTrendingUsers: async (limit = 15, days = 7) => {
    return apiCall(`/api/discovery/trending?limit=${limit}&days=${days}`);
  },
  
  getProfile: async (hashId: string) => {
    try {
      const response = await apiCall(`/api/users/profile/${hashId}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Success',
          data: {
            _id: response.data._id,
            username: response.data.username,
            displayName: response.data.displayName,
            bio: response.data.bio || '',
            location: response.data.location,
            website: response.data.website,
            avatar: response.data.avatar,
            coverImage: response.data.coverImage,
            email: response.data.email,
            phone: response.data.phone,
            pronouns: response.data.pronouns,
            followerCount: response.data.followerCount || 0,
            followingCount: response.data.followingCount || 0,
            postCount: response.data.postCount || 0,
            isFollowing: response.data.isFollowing,
            isOwnProfile: response.data.isOwnProfile,
            isSetupComplete: response.data.isSetupComplete !== false,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            lastLoginAt: response.data.lastLoginAt
          },
          statusCode: response.statusCode
        };
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  updateProfile: async (hashId: string, updateData: {
    username?: string; 
    displayName?: string; 
    bio?: string; 
    location?: string;
    website?: string;
    phone?: string;
    pronouns?: string;
    avatarBase64?: string;
    coverImageBase64?: string;
    avatarFile?: File;
    coverImageFile?: File;
  }) => {
    const hasFiles = updateData.avatarFile || updateData.coverImageFile;

    if (hasFiles) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Add text fields (use !== undefined to allow empty strings)
      if (updateData.username) formData.append('username', updateData.username);
      if (updateData.displayName) formData.append('displayName', updateData.displayName);
      if (updateData.bio !== undefined) formData.append('bio', updateData.bio);
      if (updateData.location !== undefined) formData.append('location', updateData.location);
      if (updateData.website !== undefined) formData.append('website', updateData.website);
      if (updateData.phone !== undefined) formData.append('phone', updateData.phone);
      if (updateData.pronouns !== undefined) formData.append('pronouns', updateData.pronouns);
      
      // Add files
      if (updateData.avatarFile) {
        formData.append('avatar', updateData.avatarFile);
      }
      if (updateData.coverImageFile) {
        formData.append('coverImage', updateData.coverImageFile);
      }

      return apiFormDataCall(`/api/users/profile/${hashId}`, formData, 'PUT');
    } else {
      // Use JSON for text-only updates
      return apiCall(`/api/users/profile/${hashId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    }
  },

  uploadAvatar: async (hashId: string, file: File): Promise<any> => {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid image file.');
    }

    try {
      const resizedFile = await resizeImage(file, 400, 400, 0.9);
      return await userApi.updateProfile(hashId, { 
        avatarFile: resizedFile 
      });
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  uploadCoverImage: async (hashId: string, file: File): Promise<any> => {
    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a valid image file.');
    }

    try {
      const resizedFile = await resizeImage(file, 1200, 400, 0.85);
      return await userApi.updateProfile(hashId, { 
        coverImageFile: resizedFile 
      });
    } catch (error) {
      throw new Error(`Cover upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  searchUsers: async (params: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    
    return apiCall(`/api/users?${searchParams.toString()}`);
  },

  getUserStats: async (userId: string) => {
    return apiCall(`/api/users/${userId}/stats`);
  },
};

// Advanced Search API
export const searchApi = {
  // Unified search - tìm kiếm cả users và posts
  unifiedSearch: async (params: {
    q: string;
    type?: 'all' | 'users' | 'posts';
    page?: number;
    limit?: number;
    sort?: 'relevance' | 'latest' | 'popular';
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.type) searchParams.append('type', params.type);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    
    return apiCall(`/api/search?${searchParams.toString()}`);
  },

  // Search posts với advanced filters
  searchPosts: async (params: {
    q?: string;
    hashtag?: string;
    page?: number;
    limit?: number;
    sort?: 'relevance' | 'latest' | 'popular';
    dateFrom?: string;
    dateTo?: string;
    hasMedia?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.hashtag) searchParams.append('hashtag', params.hashtag);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.hasMedia !== undefined) searchParams.append('hasMedia', params.hasMedia.toString());
    
    return apiCall(`/api/search/posts?${searchParams.toString()}`);
  },

  // Get search suggestions
  getSearchSuggestions: async (params: { q: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/search/suggestions?${searchParams.toString()}`);
  },

  // Get trending hashtags
  getTrendingHashtags: async (params?: { limit?: number; period?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.period) searchParams.append('period', params.period.toString());
    
    return apiCall(`/api/search/trending?${searchParams.toString()}`);
  },
};

// Post API
export const api = {
  post: {
    getPosts: async (params: { page?: number; limit?: number; sort?: string } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sort) searchParams.append('sort', params.sort);
      
      return apiCall(`/api/posts?${searchParams.toString()}`);
    },
    
    createPost: async (postData: { content: string; images?: string[]; video?: string; visibility?: string; userId?: string }) => {
      return apiCall('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    },

    uploadImage: async (file: File): Promise<string> => {
      if (!IMAGE_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a valid image file.');
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await apiFormDataCall('/api/posts/upload-image', formData);
        
        if (response.success && response.data?.url) {
          return response.data.url;
        }
        
        throw new Error('Invalid response format from server');
      } catch (error) {
        throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    uploadVideo: async (file: File): Promise<string> => {
      if (!VIDEO_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a valid video file.');
      }

      const formData = new FormData();
      formData.append('video', file);

      try {
        const response = await apiFormDataCall('/api/posts/upload-video', formData);
        
        if (response.success && response.data?.url) {
          return response.data.url;
        }
        
        throw new Error('Invalid response format from server');
      } catch (error) {
        throw new Error(`Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    likePost: async (postId: string) => {
      return apiCall(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
    },

    unlikePost: async (postId: string) => {
      return apiCall(`/api/posts/${postId}/unlike`, {
        method: 'POST',
      });
    },

    toggleLike: async (postId: string) => {
      return apiCall(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
    },

    deletePost: async (postId: string) => {
      return apiCall(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    },

    archivePost: async (postId: string) => {
      return apiCall(`/api/posts/${postId}/archive`, {
        method: 'PATCH',
      });
    },

    restorePost: async (postId: string) => {
      return apiCall(`/api/posts/${postId}/restore`, {
        method: 'PATCH',
      });
    },

    getArchivedPosts: async (params: { page?: number; limit?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      return apiCall(`/api/posts/archived?${searchParams.toString()}`);
    },

    getPost: async (postId: string) => {
      return apiCall(`/api/posts/${postId}`);
    },

    getUserPosts: async (userId: string, params: { page?: number; limit?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      return apiCall(`/api/posts/user/${userId}?${searchParams.toString()}`);
    },

    repostPost: async (postId: string, content?: string) => {
      return apiCall(`/api/posts/${postId}/repost`, {
        method: 'POST',
        body: JSON.stringify({ content: content || '' }),
      });
    },
  },

  // Comments API
  comments: {
    getComments: async (postId: string, params: { page?: number; limit?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      const response = await apiCall(`/api/posts/${postId}/comments?${searchParams.toString()}`);
      
      if (response.success && Array.isArray(response.data)) {
        return {
          ...response,
          data: response.data.map((comment: any) => ({
            ...comment,
            replies: comment.replies || []
          }))
        };
      }
      
      return response;
    },

    createReply: async (postId: string, parentCommentId: string, replyData: { 
      content: string; 
      image?: string; 
    }) => {
      try {
        const response = await apiCall(`/api/posts/${postId}/comments/${parentCommentId}/replies`, {
          method: 'POST',
          body: JSON.stringify(replyData),
        });

        return response;
      } catch (error) {
        throw error;
      }
    },

    createComment: async (postId: string, commentData: { 
      content: string; 
      image?: string; 
    }) => {
      try {
        const response = await apiCall(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify(commentData),
        });

        return response;
      } catch (error) {
        throw error;
      }
    },

    likeComment: async (postId: string, commentId: string) => {
      return apiCall(`/api/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
      });
    },

    unlikeComment: async (postId: string, commentId: string) => {
      return apiCall(`/api/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
      });
    },

    deleteComment: async (postId: string, commentId: string) => {
      return apiCall(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });
    },

    updateComment: async (postId: string, commentId: string, updateData: {
      content: string;
      image?: string;
    }) => {
      return apiCall(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },

    getReplies: async (commentId: string, params: { page?: number; limit?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      return apiCall(`/api/comments/${commentId}/replies?${searchParams.toString()}`);
    },

    uploadCommentImage: async (file: File): Promise<string> => {
      if (!IMAGE_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a valid image file.');
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await apiFormDataCall('/api/comments/upload-image', formData);
        
        if (response.success && response.data?.url) {
          return response.data.url;
        }
        
        throw new Error('Invalid response format from server');
      } catch (error) {
        throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  // Follow API
  follow: {
    // ✅ OPTIMIZED: Direct API call without queue for follow actions
    toggleFollow: async (userId: string) => {
      const url = `${API_BASE_URL}/api/users/${userId}/follow`;
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    },

    // Legacy methods for backward compatibility
    followUser: async (userId: string) => {
      return apiCall(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
    },

    unfollowUser: async (userId: string) => {
      return apiCall(`/api/users/${userId}/follow`, {
        method: 'POST', // ✅ SỬA: Backend chỉ có POST route
      });
    },

    // ✅ OPTIMIZED: Direct API call for status check
    checkFollowStatus: async (userId: string) => {
      const url = `${API_BASE_URL}/api/users/${userId}/follow/status`;
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    },

    getFollowers: async (userId: string, params: { page?: number; limit?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      return apiCall(`/api/users/${userId}/followers?${searchParams.toString()}`);
    },

    getFollowing: async (userId: string, params: { page?: number; limit?: number } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      return apiCall(`/api/users/${userId}/following?${searchParams.toString()}`);
    },
  },

  // Link Preview API
  linkPreview: {
    getPreview: async (url: string) => {
      return apiCall('/api/posts/preview-link', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },

    getMultiplePreviews: async (content: string) => {
      return apiCall('/api/posts/preview-links', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  },

  // Chat API
  chat: {
    getOrCreateDirectConversation: async (userId: string) => {
      return apiCall(`/api/chat/conversations/direct/${userId}`);
    },

    getConversations: async () => {
      return apiCall('/api/chat/conversations');
    },

    getConversation: async (conversationId: string) => {
      return apiCall(`/api/chat/conversations/${conversationId}`);
    },

    getMessages: async (conversationId: string, page = 1, limit = 20) => {
      return apiCall(`/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    },

    sendMessage: async (conversationId: string, content: string) => {
      return apiCall(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  },
};

export default api;
