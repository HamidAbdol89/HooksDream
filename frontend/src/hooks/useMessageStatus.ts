// hooks/useMessageStatus.ts - Hook để manage message status và real-time updates
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChatSocket } from '@/hooks/useSocket';
import { useAppStore } from '@/store/useAppStore';
import { MessageStatus } from '@/types/chat';

export const useMessageStatus = (conversationId?: string) => {
  const { token } = useGoogleAuth();
  const { user: currentUser } = useAppStore();
  const currentUserId = currentUser?._id || currentUser?.id;
  const queryClient = useQueryClient();
  const { 
    onNewMessage, 
    onMessageStatus, 
    onMessagesRead,
    emitMessageRead,
    emitMessageDelivered 
  } = useChatSocket(conversationId);

  // Setup real-time listeners
  useEffect(() => {
    if (!conversationId) return;

    // Listen for new messages
    onNewMessage((data) => {
      queryClient.setQueryData(
        ['chat', 'messages', data.conversationId],
        (oldData: any) => {
          if (!oldData) return [data.message];
          return [...oldData, data.message];
        }
      );
      
      // Update conversations list
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'conversations'] 
      });
    });

    // Listen for message status updates
    onMessageStatus((data) => {
      queryClient.setQueryData(
        ['chat', 'messages', data.conversationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((message: any) => 
            message._id === data.messageId 
              ? {
                  ...message,
                  messageStatus: {
                    ...message.messageStatus,
                    status: data.status,
                    timestamp: new Date().toISOString()
                  }
                }
              : message
          );
        }
      );
    });

    // Listen for read receipts
    onMessagesRead((data) => {
      queryClient.setQueryData(
        ['chat', 'messages', data.conversationId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((message: any) => 
            data.messageIds.includes(message._id)
              ? {
                  ...message,
                  messageStatus: {
                    ...message.messageStatus,
                    status: 'read',
                    readBy: [...(message.messageStatus?.readBy || []), data.readBy]
                  }
                }
              : message
          );
        }
      );
    });
  }, [conversationId, onNewMessage, onMessageStatus, onMessagesRead, queryClient]);

  // Mark message as read using socket
  const markAsRead = useCallback((messageId: string) => {
    if (conversationId) {
      emitMessageRead(messageId);
    }
  }, [conversationId, emitMessageRead]);

  // Mark conversation as read (all messages)
  const markConversationAsRead = useCallback(async () => {
    if (!token || !conversationId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Invalidate queries
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'messages', conversationId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, [token, conversationId, queryClient]);

  // Send image message with optimistic status update
  const sendImageMessageWithStatus = useCallback(async (
    imageFile: File,
    text?: string,
    tempId?: string
  ): Promise<{ success: boolean; messageId?: string }> => {
    if (!token || !conversationId) return { success: false };

    const actualTempId = tempId || `temp-${Date.now()}-${Math.random()}`;

    // Create optimistic image message
    const tempMessage = {
      _id: actualTempId,
      sender: {
        _id: 'current-user',
        username: 'You',
        displayName: 'You',
        avatar: ''
      },
      content: { 
        image: URL.createObjectURL(imageFile),
        text: text || undefined
      },
      type: 'image',
      createdAt: new Date().toISOString(),
      messageStatus: {
        status: 'sending' as const,
        timestamp: new Date().toISOString()
      }
    };

    // Update cache optimistically
    queryClient.setQueryData(
      ['chat', 'messages', conversationId],
      (oldData: any) => {
        if (!oldData) return [tempMessage];
        return [...oldData, tempMessage];
      }
    );

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (text) {
        formData.append('text', text);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages/image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Replace temp message with real message
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === actualTempId ? {
                ...data.data,
                messageStatus: {
                  status: 'sent',
                  timestamp: new Date().toISOString()
                }
              } : msg
            );
          }
        );

        // Invalidate conversations to update last message
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });

        return { success: true, messageId: data.data._id };
      } else {
        // Mark as failed
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === actualTempId ? {
                ...msg,
                messageStatus: {
                  status: 'failed',
                  timestamp: new Date().toISOString()
                }
              } : msg
            );
          }
        );
        return { success: false };
      }
    } catch (error) {
      // Mark as failed
      queryClient.setQueryData(
        ['chat', 'messages', conversationId],
        (oldData: any) => {
          if (!oldData) return [];
          return oldData.map((msg: any) => 
            msg._id === actualTempId ? {
              ...msg,
              messageStatus: {
                status: 'failed',
                timestamp: new Date().toISOString()
              }
            } : msg
          );
        }
      );
      return { success: false };
    }
  }, [token, conversationId, queryClient]);

  // Send message with optimistic status update
  const sendMessageWithStatus = useCallback(async (
    text: string,
    tempId: string
  ): Promise<{ success: boolean; messageId?: string }> => {
    if (!token || !conversationId) return { success: false };

    // Optimistic update - add message with 'sent' status immediately
    const tempMessage = {
      _id: tempId,
      sender: {
        _id: currentUserId, // Use actual current user ID
        username: currentUser?.username || 'You',
        displayName: currentUser?.displayName || 'You',
        avatar: currentUser?.avatar || ''
      },
      content: { text },
      createdAt: new Date().toISOString(),
      messageStatus: {
        status: 'sent' as const, // Optimistic: assume success
        timestamp: new Date().toISOString()
      },
      isOptimistic: true // Flag to track optimistic messages
    };

    // Update cache optimistically
    queryClient.setQueryData(
      ['chat', 'messages', conversationId],
      (oldData: any) => {
        if (!oldData) return [tempMessage];
        return [...oldData, tempMessage];
      }
    );

    // Fallback to 'sending' if network is slow (after 500ms)
    const slowNetworkTimeout = setTimeout(() => {
      queryClient.setQueryData(
        ['chat', 'messages', conversationId],
        (oldData: any) => {
          if (!oldData) return [];
          return oldData.map((msg: any) => 
            msg._id === tempId && msg.isOptimistic ? {
              ...msg,
              messageStatus: {
                status: 'sending',
                timestamp: new Date().toISOString()
              }
            } : msg
          );
        }
      );
    }, 500); // 500ms threshold for slow network

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Clear slow network timeout - request completed successfully
        clearTimeout(slowNetworkTimeout);
        
        // Replace temp message with real message
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === tempId ? {
                ...data.data,
                messageStatus: {
                  status: 'delivered', // Upgrade to delivered since server confirmed
                  timestamp: new Date().toISOString()
                },
                isOptimistic: false // No longer optimistic
              } : msg
            );
          }
        );

        // Invalidate conversations to update last message
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });

        return { success: true, messageId: data.data._id };
      } else {
        // Clear timeout and mark as failed
        clearTimeout(slowNetworkTimeout);
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === tempId ? {
                ...msg,
                messageStatus: {
                  status: 'failed',
                  timestamp: new Date().toISOString()
                },
                isOptimistic: false
              } : msg
            );
          }
        );
        return { success: false };
      }
    } catch (error) {
      // Clear timeout and mark as failed
      clearTimeout(slowNetworkTimeout);
      queryClient.setQueryData(
        ['chat', 'messages', conversationId],
        (oldData: any) => {
          if (!oldData) return [];
          return oldData.map((msg: any) => 
            msg._id === tempId ? {
              ...msg,
              messageStatus: {
                status: 'failed',
                timestamp: new Date().toISOString()
              }
            } : msg
          );
        }
      );
      return { success: false };
    }
  }, [token, conversationId, queryClient, currentUserId, currentUser]);

  // Mark single message as read using API
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!token || !conversationId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ messageIds: [messageId] })
        }
      );

      if (response.ok) {
        // Invalidate queries để update UI
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'messages', conversationId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, [token, conversationId, queryClient]);

  // Send video message with optimistic status update
  const sendVideoMessageWithStatus = useCallback(async (
    videoFile: File,
    text?: string,
    duration?: number,
    tempId?: string
  ): Promise<{ success: boolean; messageId?: string }> => {
    if (!token || !conversationId) return { success: false };

    const actualTempId = tempId || `temp-${Date.now()}-${Math.random()}`;

    // Create optimistic video message
    const tempMessage = {
      _id: actualTempId,
      sender: {
        _id: 'current-user',
        username: 'You',
        displayName: 'You',
        avatar: ''
      },
      content: { 
        video: {
          url: URL.createObjectURL(videoFile),
          duration: duration || 0
        },
        text: text || undefined
      },
      type: 'video',
      createdAt: new Date().toISOString(),
      messageStatus: {
        status: 'sending' as const,
        timestamp: new Date().toISOString()
      }
    };

    // Update cache optimistically
    queryClient.setQueryData(
      ['chat', 'messages', conversationId],
      (oldData: any) => {
        if (!oldData) return [tempMessage];
        return [...oldData, tempMessage];
      }
    );

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (text) formData.append('text', text);
      if (duration) formData.append('duration', duration.toString());

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages/video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Replace temp message with real message
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === actualTempId ? {
                ...data.data,
                messageStatus: {
                  status: 'sent',
                  timestamp: new Date().toISOString()
                }
              } : msg
            );
          }
        );

        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });

        return { success: true, messageId: data.data._id };
      } else {
        // Mark as failed
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === actualTempId ? {
                ...msg,
                messageStatus: {
                  status: 'failed',
                  timestamp: new Date().toISOString()
                }
              } : msg
            );
          }
        );
        return { success: false };
      }
    } catch (error) {
      // Mark as failed
      queryClient.setQueryData(
        ['chat', 'messages', conversationId],
        (oldData: any) => {
          if (!oldData) return [];
          return oldData.map((msg: any) => 
            msg._id === actualTempId ? {
              ...msg,
              messageStatus: {
                status: 'failed',
                timestamp: new Date().toISOString()
              }
            } : msg
          );
        }
      );
      return { success: false };
    }
  }, [token, conversationId, queryClient]);

  // Send audio message with optimistic status update
  const sendAudioMessageWithStatus = useCallback(async (
    audioFile: File,
    duration?: number,
    tempId?: string
  ): Promise<{ success: boolean; messageId?: string }> => {
    if (!token || !conversationId) return { success: false };

    const actualTempId = tempId || `temp-${Date.now()}-${Math.random()}`;

    // Create optimistic audio message
    const tempMessage = {
      _id: actualTempId,
      sender: {
        _id: 'current-user',
        username: 'You',
        displayName: 'You',
        avatar: ''
      },
      content: { 
        audio: {
          url: URL.createObjectURL(audioFile),
          duration: duration || 0
        }
      },
      type: 'audio',
      createdAt: new Date().toISOString(),
      messageStatus: {
        status: 'sending' as const,
        timestamp: new Date().toISOString()
      }
    };

    // Update cache optimistically
    queryClient.setQueryData(
      ['chat', 'messages', conversationId],
      (oldData: any) => {
        if (!oldData) return [tempMessage];
        return [...oldData, tempMessage];
      }
    );

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (duration) formData.append('duration', duration.toString());

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages/audio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Replace temp message with real message
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === actualTempId ? {
                ...data.data,
                messageStatus: {
                  status: 'sent',
                  timestamp: new Date().toISOString()
                }
              } : msg
            );
          }
        );

        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });

        return { success: true, messageId: data.data._id };
      } else {
        // Mark as failed
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === actualTempId ? {
                ...msg,
                messageStatus: {
                  status: 'failed',
                  timestamp: new Date().toISOString()
                }
              } : msg
            );
          }
        );
        return { success: false };
      }
    } catch (error) {
      // Mark as failed
      queryClient.setQueryData(
        ['chat', 'messages', conversationId],
        (oldData: any) => {
          if (!oldData) return [];
          return oldData.map((msg: any) => 
            msg._id === actualTempId ? {
              ...msg,
              messageStatus: {
                status: 'failed',
                timestamp: new Date().toISOString()
              }
            } : msg
          );
        }
      );
      return { success: false };
    }
  }, [token, conversationId, queryClient]);

  return {
    markAsRead: markMessageAsRead,
    markConversationAsRead,
    sendMessageWithStatus,
    sendImageMessageWithStatus,
    sendVideoMessageWithStatus,
    sendAudioMessageWithStatus
  };
};
