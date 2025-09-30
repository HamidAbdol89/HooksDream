// services/chatApi.ts - Professional Chat API Service
import { memoryCache } from '@/utils/memoryCache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Professional Rate Limiting với exponential backoff
const rateLimiter = new Map<string, { count: number; resetTime: number; backoffMultiplier: number }>();
const RATE_LIMIT_WINDOW = 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

// Circuit Breaker Pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000; // 30 seconds

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

const circuitBreaker = new CircuitBreaker();

const checkRateLimit = (endpoint: string): boolean => {
  const now = Date.now();
  const limiter = rateLimiter.get(endpoint) || { count: 0, resetTime: now, backoffMultiplier: 1 };
  
  // Reset window if expired
  if (now > limiter.resetTime) {
    limiter.count = 0;
    limiter.resetTime = now + RATE_LIMIT_WINDOW;
    limiter.backoffMultiplier = 1;
  }
  
  if (limiter.count >= MAX_REQUESTS_PER_WINDOW) {
    // Exponential backoff
    limiter.backoffMultiplier *= 2;
    limiter.resetTime = now + (RATE_LIMIT_WINDOW * limiter.backoffMultiplier);
    return false;
  }
  
  limiter.count++;
  rateLimiter.set(endpoint, limiter);
  return true;
};

// Auth headers helper - Standardized to use auth_token
const getAuthHeaders = (): HeadersInit => {
  // Use modern auth system token only
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Professional API call với caching và circuit breaker
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
  
  // Check memory cache first
  if (options.method === 'GET' || !options.method) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Check rate limit
  if (!checkRateLimit(endpoint)) {
    // Try to return stale cache if available
    const staleCache = memoryCache.get(`stale:${cacheKey}`);
    if (staleCache) {
      return staleCache;
    }
    throw new Error('Rate limited - too many requests');
  }

  return circuitBreaker.execute(async () => {
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
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Cache successful GET responses
    if (options.method === 'GET' || !options.method) {
      memoryCache.set(cacheKey, data, 15 * 60 * 1000); // 15 minutes
      // Keep stale version for fallback
      memoryCache.set(`stale:${cacheKey}`, data, 60 * 60 * 1000); // 1 hour
    }
    
    return data;
  });
};

// Types
export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  participants: User[];
  lastMessage?: Message;
  lastActivity: string;
  unreadCount?: number;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: {
    text?: string;
    image?: string;
    file?: {
      url: string;
      name: string;
      size: number;
      type: string;
    };
  };
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  replyTo?: string;
  reactions: Array<{
    user: string;
    emoji: string;
    createdAt: string;
  }>;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Chat API
export const chatApi = {
  // Get all conversations
  getConversations: async (params: { page?: number; limit?: number } = {}): Promise<ApiResponse<Conversation[]>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/chat/conversations?${searchParams.toString()}`);
  },

  // Get or create direct conversation
  getOrCreateDirectConversation: async (userId: string): Promise<ApiResponse<Conversation>> => {
    return apiCall(`/api/chat/conversations/direct/${userId}`);
  },

  // Get messages in conversation
  getMessages: async (conversationId: string, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<Message[]>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    return apiCall(`/api/chat/conversations/${conversationId}/messages?${searchParams.toString()}`);
  },

  // Send message
  sendMessage: async (conversationId: string, messageData: {
    text?: string;
    image?: string;
    replyTo?: string;
  }): Promise<ApiResponse<Message>> => {
    return apiCall(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Mark messages as read
  markAsRead: async (conversationId: string, messageIds: string[]): Promise<ApiResponse> => {
    return apiCall(`/api/chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      body: JSON.stringify({ messageIds }),
    });
  },

  // Delete message
  deleteMessage: async (messageId: string): Promise<ApiResponse> => {
    return apiCall(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Add reaction to message
  addReaction: async (messageId: string, emoji: string): Promise<ApiResponse> => {
    return apiCall(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  // Upload image for chat
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/api/posts/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) throw new Error('Image upload failed');
    
    const result = await response.json();
    if (result.success && result.data?.url) {
      return result.data.url;
    }
    
    throw new Error('Invalid response format from server');
  },
};

export default chatApi;
