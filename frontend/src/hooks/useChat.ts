// hooks/useChat.ts - Chat Management Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, Conversation, Message, ApiResponse } from '@/services/chatApi';
import { useChatSocket, useSocket } from '@/hooks/useSocket';
import { useAppStore } from '@/store/useAppStore';

// Query keys
export const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatQueryKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) => [...chatQueryKeys.all, 'messages', conversationId] as const,
};

// Main chat hook
export const useChat = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAppStore();
  const currentUserId = currentUser?._id || currentUser?.id;
  const { socket } = useSocket();

  // Setup real-time message listeners
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewMessage = (data: { conversationId: string; message: any }) => {
      const { conversationId, message } = data;
      
      // Add new message to messages query
      queryClient.setQueryData<ApiResponse<Message[]>>(
        chatQueryKeys.messages(conversationId),
        (oldData) => {
          if (!oldData || !oldData.data) return oldData;
          return {
            ...oldData,
            data: [...oldData.data, message]
          };
        }
      );
      
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    };

    const handleConversationUpdated = (data: { conversationId: string; lastMessage: any }) => {
      // Update conversations list when last message changes
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, currentUserId, queryClient]);

  // Professional Conversations Query với advanced caching
  const useConversations = (params: { page?: number; limit?: number } = {}) => {
    return useQuery({
      queryKey: [...chatQueryKeys.conversations(), params],
      queryFn: () => chatApi.getConversations(params),
      enabled: !!currentUserId,
      staleTime: 15 * 60 * 1000, // 15 minutes - Very aggressive caching
      gcTime: 60 * 60 * 1000, // 1 hour - Keep in memory longer
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      // Professional optimization
      structuralSharing: true, // Prevent unnecessary re-renders
      // Network mode optimization
      networkMode: 'online', // Only fetch when online
      // Retry configuration
      retry: (failureCount, error: any) => {
        if (error?.status === 429) return false; // Don't retry rate limits
        return failureCount < 2; // Max 2 retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  // Get or create direct conversation
  const useDirectConversation = (userId: string) => {
    return useQuery({
      queryKey: chatQueryKeys.conversation(`direct-${userId}`),
      queryFn: () => chatApi.getOrCreateDirectConversation(userId),
      enabled: !!userId && !!currentUserId && userId !== currentUserId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Get messages in conversation
  const useMessages = (conversationId: string, params: { page?: number; limit?: number } = {}) => {
    return useQuery({
      queryKey: [...chatQueryKeys.messages(conversationId), params],
      queryFn: () => chatApi.getMessages(conversationId, params),
      enabled: !!conversationId,
      staleTime: 10 * 1000, // 10 seconds
      gcTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, messageData }: {
      conversationId: string;
      messageData: { text?: string; image?: string; replyTo?: string };
    }) => chatApi.sendMessage(conversationId, messageData),
    onMutate: async ({ conversationId, messageData }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: chatQueryKeys.messages(conversationId) });
      
      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData<ApiResponse<Message[]>>(
        chatQueryKeys.messages(conversationId)
      );
      
      // Optimistically add new message
      if (previousMessages?.data) {
        const optimisticMessage: Message = {
          _id: `temp-${Date.now()}`,
          conversation: conversationId,
          sender: {
            _id: currentUserId!,
            username: currentUser?.username || 'You',
            displayName: currentUser?.displayName || 'You',
            avatar: currentUser?.avatar,
          },
          content: messageData,
          type: messageData.image ? 'image' : 'text',
          status: 'sending',
          readBy: [],
          reactions: [],
          isDeleted: false,
          isEdited: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        queryClient.setQueryData<ApiResponse<Message[]>>(
          chatQueryKeys.messages(conversationId),
          {
            ...previousMessages,
            data: [...previousMessages.data, optimisticMessage]
          }
        );
      }
      
      return { previousMessages };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatQueryKeys.messages(variables.conversationId),
          context.previousMessages
        );
      }
    },
    onSuccess: (data, { conversationId }) => {
      // Update messages list
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(conversationId) });
      // Update conversations list (for last message)
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: ({ conversationId, messageIds }: {
      conversationId: string;
      messageIds: string[];
    }) => chatApi.markAsRead(conversationId, messageIds),
    onSuccess: (data, { conversationId }) => {
      // Update messages to show as read
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(conversationId) });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: (data, messageId) => {
      // Remove message from all conversations
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => 
      chatApi.addReaction(messageId, emoji),
    onSuccess: () => {
      // Update messages to show new reaction
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => chatApi.uploadImage(file),
  });

  return {
    // Queries
    useConversations,
    useDirectConversation,
    useMessages,
    
    // Mutations
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    addReaction: addReactionMutation.mutateAsync,
    uploadImage: uploadImageMutation.mutateAsync,
    
    // Loading states
    isSendingMessage: sendMessageMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    
    // Current user info
    currentUserId,
  };
};

// Hook for managing a specific conversation
export const useConversation = (conversationId: string) => {
  const { useMessages, sendMessage, markAsRead, currentUserId } = useChat();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Get messages for this conversation
  const { data: messagesData, isLoading, error, refetch } = useMessages(conversationId);
  const messages = messagesData?.data || [];
  
  // Socket integration
  const {
    onNewMessage,
    onMessagesRead,
    onMessageDeleted,
    onMessageReaction,
    onTypingUpdate,
    onUserStatus,
    emitTyping,
    emitMessageDelivered,
    emitMessageRead,
  } = useChatSocket(conversationId);
  
  // Handle real-time events
  useEffect(() => {
    if (!conversationId) return;
    
    // Handle new messages
    onNewMessage((data) => {
      if (data.conversationId === conversationId) {
        refetch();
        // Mark as delivered
        emitMessageDelivered(data.message._id);
      }
    });
    
    // Handle message read receipts
    onMessagesRead((data) => {
      if (data.conversationId === conversationId) {
        refetch();
      }
    });
    
    // Handle message deletions
    onMessageDeleted((data) => {
      if (data.conversationId === conversationId) {
        refetch();
      }
    });
    
    // Handle message reactions
    onMessageReaction((data) => {
      if (data.conversationId === conversationId) {
        refetch();
      }
    });
    
    // Handle typing indicators
    onTypingUpdate((data) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          
          // Clear existing timeout for this user
          const existingTimeout = typingTimeoutRef.current.get(data.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          if (data.isTyping) {
            newSet.add(data.userId);
            // Set timeout to remove typing indicator
            const timeout = setTimeout(() => {
              setTypingUsers(current => {
                const updated = new Set(current);
                updated.delete(data.userId);
                return updated;
              });
              typingTimeoutRef.current.delete(data.userId);
            }, 3000);
            typingTimeoutRef.current.set(data.userId, timeout);
          } else {
            newSet.delete(data.userId);
            typingTimeoutRef.current.delete(data.userId);
          }
          
          return newSet;
        });
      }
    });
    
    // Handle user status updates
    onUserStatus((data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });
    
  }, [conversationId, currentUserId, onNewMessage, onMessagesRead, onMessageDeleted, onMessageReaction, onTypingUpdate, onUserStatus, emitMessageDelivered, refetch]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    emitTyping(isTyping);
  }, [emitTyping]);
  
  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    try {
      await markAsRead({ conversationId, messageIds });
      // Emit read receipt
      messageIds.forEach(messageId => {
        emitMessageRead(messageId);
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [conversationId, markAsRead, emitMessageRead]);
  
  // Send message
  const sendConversationMessage = useCallback(async (messageData: {
    text?: string;
    image?: string;
    replyTo?: string;
  }) => {
    try {
      await sendMessage({ conversationId, messageData });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [conversationId, sendMessage]);
  
  return {
    messages,
    isLoading,
    error,
    typingUsers: Array.from(typingUsers),
    onlineUsers: Array.from(onlineUsers),
    sendMessage: sendConversationMessage,
    sendTypingIndicator,
    markMessagesAsRead,
    refetch,
  };
};

// Hook for starting a chat with a user
export const useStartChat = () => {
  const { useDirectConversation } = useChat();
  
  const startChatWithUser = useCallback(async (userId: string) => {
    try {
      // This will create conversation if it doesn't exist
      const { data } = await useDirectConversation(userId).refetch();
      if (data?.success && data.data) {
        return data.data;
      }
      throw new Error('Failed to create conversation');
    } catch (error) {
      console.error('Failed to start chat:', error);
      throw error;
    }
  }, [useDirectConversation]);
  
  return {
    startChatWithUser,
  };
};

export default useChat;
