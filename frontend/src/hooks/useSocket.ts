// hooks/useSocket.ts - Real-time Socket.IO Client Hook
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGoogleAuth } from './useGoogleAuth';

interface SocketEvents {
  // Comment events
  'comment:liked': (data: {
    commentId: string;
    postId: string;
    userId: string;
    isLiked: boolean;
    likeCount: number;
    timestamp: string;
  }) => void;
  
  'comment:created': (data: {
    comment: any;
    postId: string;
    userId: string;
    timestamp: string;
  }) => void;
  
  'comment:deleted': (data: {
    commentId: string;
    postId: string;
    userId: string;
    timestamp: string;
  }) => void;
  
  'comment:edited': (data: {
    commentId: string;
    postId: string;
    content: string;
    userId: string;
    timestamp: string;
  }) => void;
  
  'reply:created': (data: {
    reply: any;
    parentCommentId: string;
    postId: string;
    userId: string;
    timestamp: string;
  }) => void;

  // Post events
  'post:liked': (data: {
    postId: string;
    userId: string;
    isLiked: boolean;
    likeCount: number;
    timestamp: string;
  }) => void;

  'post:created': (data: {
    post: any;
    userId: string;
    timestamp: string;
  }) => void;

  'post:deleted': (data: {
    postId: string;
    userId: string;
    timestamp: string;
  }) => void;

  'post:shared': (data: {
    postId: string;
    userId: string;
    shareCount: number;
    timestamp: string;
  }) => void;

  // User activity events
  'user:activity:update': (data: {
    userId: string;
    activity: string;
    timestamp: string;
  }) => void;

  'comment:typing:update': (data: {
    postId: string;
    userId: string;
    isTyping: boolean;
    timestamp: string;
  }) => void;

  // Follow events
  'user:follow:update': (data: {
    followerId: string;
    followingId?: string;
    targetUserId?: string;
    isFollowing: boolean;
    followerCount: number;
    followingCount?: number;
    type: string;
    timestamp: string;
  }) => void;

  'user:follow:activity': (data: {
    followerId: string;
    followingId: string;
    isFollowing: boolean;
    followerCount: number;
    followingCount: number;
    timestamp: string;
  }) => void;

  // Chat events
  'message:new': (data: {
    conversationId: string;
    message: any;
  }) => void;

  'messages:read': (data: {
    conversationId: string;
    readBy: string;
    messageIds: string[];
  }) => void;

  'message:deleted': (data: {
    conversationId: string;
    messageId: string;
  }) => void;

  'message:reaction': (data: {
    conversationId: string;
    messageId: string;
    reaction: {
      user: string;
      emoji: string;
    };
  }) => void;

  'chat:typing:update': (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
    timestamp: string;
  }) => void;

  'chat:user:joined': (data: {
    userId: string;
    conversationId: string;
    timestamp: string;
  }) => void;

  'chat:user:left': (data: {
    userId: string;
    conversationId: string;
    timestamp: string;
  }) => void;

  'chat:user:status': (data: {
    userId: string;
    status: 'online' | 'offline';
    timestamp: string;
  }) => void;

  'chat:message:status': (data: {
    messageId: string;
    conversationId: string;
    status: 'delivered' | 'read';
    userId: string;
    timestamp: string;
  }) => void;
}

export const useSocket = () => {
  const { token, isConnected: isAuthConnected } = useGoogleAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventListenersRef = useRef<Map<string, Function[]>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthConnected || !token) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      setConnectionError(error.message);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
      setIsConnected(false);
    };
  }, [isAuthConnected, token]);

  // Join post room for real-time updates
  const joinPost = useCallback((postId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join:post', postId);
    }
  }, [isConnected]);

  // Leave post room
  const leavePost = useCallback((postId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave:post', postId);
    }
  }, [isConnected]);

  // Generic event listener
  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    if (!socketRef.current) return;

    // Store the callback for cleanup
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, []);
    }
    eventListenersRef.current.get(event)!.push(callback as Function);

    socketRef.current.on(event, callback as any);
    
  }, []);

  // Remove event listener
  const off = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback?: SocketEvents[K]
  ) => {
    if (!socketRef.current) return;

    if (callback) {
      socketRef.current.off(event, callback as any);
      
      // Remove from stored callbacks
      const callbacks = eventListenersRef.current.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback as Function);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      socketRef.current.off(event);
      eventListenersRef.current.delete(event);
    }
    
    
  }, []);

  // Emit events
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Cleanup all event listeners on unmount
  useEffect(() => {
    return () => {
      eventListenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          socketRef.current?.off(event, callback as any);
        });
      });
      eventListenersRef.current.clear();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinPost,
    leavePost,
    on,
    off,
    emit
  };
};

// Hook for comment real-time updates
export const useCommentSocket = (postId: string) => {
  const { joinPost, leavePost, on, off, emit } = useSocket();
  const [realtimeComments, setRealtimeComments] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (postId) {
      joinPost(postId);
      
      return () => {
        leavePost(postId);
      };
    }
  }, [postId, joinPost, leavePost]);

  // Listen for comment like updates
  const onCommentLiked = useCallback((callback: (data: {
    commentId: string;
    isLiked: boolean;
    likeCount: number;
    userId: string;
  }) => void) => {
    on('comment:liked', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for new comments
  const onCommentCreated = useCallback((callback: (data: {
    comment: any;
    postId: string;
    userId: string;
  }) => void) => {
    on('comment:created', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for comment deletions
  const onCommentDeleted = useCallback((callback: (data: {
    commentId: string;
    postId: string;
    userId: string;
  }) => void) => {
    on('comment:deleted', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for comment edits
  const onCommentEdited = useCallback((callback: (data: {
    commentId: string;
    content: string;
    postId: string;
    userId: string;
  }) => void) => {
    on('comment:edited', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for new replies
  const onReplyCreated = useCallback((callback: (data: {
    reply: any;
    parentCommentId: string;
    postId: string;
    userId: string;
  }) => void) => {
    on('reply:created', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Emit comment like
  const emitCommentLike = useCallback((commentId: string, isLiked: boolean, likeCount: number) => {
    emit('comment:like', {
      commentId,
      postId,
      isLiked,
      likeCount
    });
  }, [emit, postId]);

  return {
    onCommentLiked,
    onCommentCreated,
    onCommentDeleted,
    onCommentEdited,
    onReplyCreated,
    emitCommentLike,
    realtimeComments
  };
};

// Hook for post real-time updates
export const usePostSocket = (postId?: string) => {
  const { joinPost, leavePost, on, off, emit } = useSocket();

  useEffect(() => {
    if (postId) {
      joinPost(postId);
      
      return () => {
        leavePost(postId);
      };
    }
  }, [postId, joinPost, leavePost]);

  // Listen for post like updates
  const onPostLiked = useCallback((callback: (data: {
    postId: string;
    isLiked: boolean;
    likeCount: number;
    userId: string;
  }) => void) => {
    on('post:liked', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for post deletions
  const onPostDeleted = useCallback((callback: (data: {
    postId: string;
    userId: string;
  }) => void) => {
    on('post:deleted', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for post shares
  const onPostShared = useCallback((callback: (data: {
    postId: string;
    shareCount: number;
    userId: string;
  }) => void) => {
    on('post:shared', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Emit post like
  const emitPostLike = useCallback((postId: string, isLiked: boolean, likeCount: number) => {
    emit('post:like', {
      postId,
      isLiked,
      likeCount
    });
  }, [emit]);

  // Emit post share
  const emitPostShare = useCallback((postId: string, shareCount: number) => {
    emit('post:share', {
      postId,
      shareCount
    });
  }, [emit]);

  return {
    onPostLiked,
    onPostDeleted,
    onPostShared,
    emitPostLike,
    emitPostShare
  };
};

// Hook for feed real-time updates
export const useFeedSocket = () => {
  const { on, off, emit } = useSocket();

  useEffect(() => {
    // Join global feed room
    emit('join:feed');
    
    return () => {
      emit('leave:feed');
    };
  }, [emit]);

  // Listen for new posts in feed
  const onPostCreated = useCallback((callback: (data: {
    post: any;
    userId: string;
  }) => void) => {
    on('post:created', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for post likes in feed
  const onPostLiked = useCallback((callback: (data: {
    postId: string;
    isLiked: boolean;
    likeCount: number;
    userId: string;
  }) => void) => {
    on('post:liked', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for post deletions in feed
  const onPostDeleted = useCallback((callback: (data: {
    postId: string;
    userId: string;
  }) => void) => {
    on('post:deleted', (data) => {
      
      callback(data);
    });
  }, [on]);

  return {
    onPostCreated,
    onPostLiked,
    onPostDeleted
  };
};

// Hook for follow/unfollow real-time updates
export const useFollowSocket = () => {
  const { on, off, emit } = useSocket();

  // Listen for follow updates
  const onFollowUpdate = useCallback((callback: (data: {
    followerId: string;
    targetUserId?: string;
    followingId?: string;
    isFollowing: boolean;
    followerCount: number;
    followingCount?: number;
    type: string;
  }) => void) => {
    on('user:follow:update', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Listen for follow activity
  const onFollowActivity = useCallback((callback: (data: {
    followerId: string;
    followingId: string;
    isFollowing: boolean;
    followerCount: number;
    followingCount: number;
  }) => void) => {
    on('user:follow:activity', (data) => {
      
      callback(data);
    });
  }, [on]);

  // Emit follow action
  const emitFollow = useCallback((targetUserId: string, isFollowing: boolean, followerCount: number) => {
    emit('user:follow', {
      targetUserId,
      isFollowing,
      followerCount
    });
  }, [emit]);

  return {
    onFollowUpdate,
    onFollowActivity,
    emitFollow
  };
};

// Hook for chat real-time updates
export const useChatSocket = (conversationId?: string) => {
  const { on, off, emit, isConnected } = useSocket();

  // Join conversation room
  useEffect(() => {
    if (conversationId && isConnected) {
      emit('chat:join', conversationId);
      
      return () => {
        emit('chat:leave', conversationId);
      };
    }
  }, [conversationId, isConnected, emit]);

  // Listen for new messages
  const onNewMessage = useCallback((callback: (data: {
    conversationId: string;
    message: any;
  }) => void) => {
    on('message:new', callback);
  }, [on]);

  // Listen for message read receipts
  const onMessagesRead = useCallback((callback: (data: {
    conversationId: string;
    readBy: string;
    messageIds: string[];
  }) => void) => {
    on('messages:read', callback);
  }, [on]);

  // Listen for message deletions
  const onMessageDeleted = useCallback((callback: (data: {
    conversationId: string;
    messageId: string;
  }) => void) => {
    on('message:deleted', callback);
  }, [on]);

  // Listen for message reactions
  const onMessageReaction = useCallback((callback: (data: {
    conversationId: string;
    messageId: string;
    reaction: { user: string; emoji: string; };
  }) => void) => {
    on('message:reaction', callback);
  }, [on]);

  // Listen for typing indicators
  const onTypingUpdate = useCallback((callback: (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void) => {
    on('chat:typing:update', callback);
  }, [on]);

  // Listen for user status updates
  const onUserStatus = useCallback((callback: (data: {
    userId: string;
    status: 'online' | 'offline';
  }) => void) => {
    on('chat:user:status', callback);
  }, [on]);

  // Listen for message status updates
  const onMessageStatus = useCallback((callback: (data: {
    messageId: string;
    conversationId: string;
    status: 'delivered' | 'read';
    userId: string;
  }) => void) => {
    on('chat:message:status', callback);
  }, [on]);

  // Emit typing indicator
  const emitTyping = useCallback((isTyping: boolean) => {
    if (conversationId) {
      emit('chat:typing', {
        conversationId,
        isTyping
      });
    }
  }, [emit, conversationId]);

  // Emit message delivered
  const emitMessageDelivered = useCallback((messageId: string) => {
    if (conversationId) {
      emit('chat:message:delivered', {
        conversationId,
        messageId
      });
    }
  }, [emit, conversationId]);

  // Emit message read
  const emitMessageRead = useCallback((messageId: string) => {
    if (conversationId) {
      emit('chat:message:read', {
        conversationId,
        messageId
      });
    }
  }, [emit, conversationId]);

  // Emit online status
  const emitOnlineStatus = useCallback(() => {
    emit('chat:status:online');
  }, [emit]);

  return {
    onNewMessage,
    onMessagesRead,
    onMessageDeleted,
    onMessageReaction,
    onTypingUpdate,
    onUserStatus,
    onMessageStatus,
    emitTyping,
    emitMessageDelivered,
    emitMessageRead,
    emitOnlineStatus
  };
};

export default useSocket;

// Hook for global chat notifications
export const useChatNotifications = () => {
  const { on, off } = useSocket();

  // Listen for new messages across all conversations
  const onGlobalNewMessage = useCallback((callback: (data: {
    conversationId: string;
    message: any;
  }) => void) => {
    on('message:new', callback);
  }, [on]);

  return {
    onGlobalNewMessage
  };
};
