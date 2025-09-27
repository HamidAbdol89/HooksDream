// hooks/useMessageStatus.ts - Hook để manage message status và real-time updates
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChatSocket } from '@/hooks/useSocket';
import { MessageStatus } from '@/types/chat';

export const useMessageStatus = (conversationId?: string) => {
  const { token } = useGoogleAuth();
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

  // Send message with optimistic status update
  const sendMessageWithStatus = useCallback(async (
    text: string,
    tempId: string
  ): Promise<{ success: boolean; messageId?: string }> => {
    if (!token || !conversationId) return { success: false };

    // Optimistic update - add message with 'sending' status
    const tempMessage = {
      _id: tempId,
      sender: {
        _id: 'current-user', // Will be replaced with actual user data
        username: 'You',
        displayName: 'You',
        avatar: ''
      },
      content: { text },
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
        
        // Replace temp message with real message
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === tempId ? {
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
    } catch (error) {
      // Mark as failed
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
  }, [token, conversationId, queryClient]);

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

  return {
    markAsRead: markMessageAsRead,
    markConversationAsRead,
    sendMessageWithStatus
  };
};
