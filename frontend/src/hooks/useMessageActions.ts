// hooks/useMessageActions.ts - Hook for message edit/recall actions
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleAuth } from './useGoogleAuth';

export const useMessageActions = (conversationId: string) => {
  const { token } = useGoogleAuth();
  const queryClient = useQueryClient();

  // Edit message
  const editMessage = useCallback(async (
    messageId: string,
    newText: string
  ): Promise<{ success: boolean; message?: any }> => {
    if (!token) return { success: false };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/messages/${messageId}/edit`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: newText })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Update cache
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === messageId ? {
                ...data.data,
                messageStatus: msg.messageStatus // Preserve message status
              } : msg
            );
          }
        );

        // Invalidate conversations to update last message if needed
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });

        return { success: true, message: data.data };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Edit message error:', error);
      throw error;
    }
  }, [token, conversationId, queryClient]);

  // Recall message
  const recallMessage = useCallback(async (
    messageId: string
  ): Promise<{ success: boolean }> => {
    if (!token) return { success: false };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/messages/${messageId}/recall`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        // Update message to show as recalled
        queryClient.setQueryData(
          ['chat', 'messages', conversationId],
          (oldData: any) => {
            if (!oldData) return [];
            return oldData.map((msg: any) => 
              msg._id === messageId ? {
                ...msg,
                content: {
                  text: 'Tin nhắn đã được thu hồi',
                  isRecalled: true
                },
                type: 'system',
                isDeleted: true,
                messageStatus: {
                  status: 'recalled',
                  timestamp: new Date().toISOString(),
                  readBy: []
                }
              } : msg
            );
          }
        );

        // Invalidate conversations to update last message if needed
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });

        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to recall message');
      }
    } catch (error) {
      console.error('Recall message error:', error);
      throw error;
    }
  }, [token, conversationId, queryClient]);

  // Copy text to clipboard
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could show a toast notification here
      console.log('Text copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }, []);

  return {
    editMessage,
    recallMessage,
    copyText
  };
};
