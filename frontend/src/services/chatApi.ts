// services/chatApi.ts - Chat API Service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Auth headers helper
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('user_hash_id') || localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Main API call function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
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

  return await response.json();
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

    const token = localStorage.getItem('user_hash_id') || localStorage.getItem('auth_token');
    
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
