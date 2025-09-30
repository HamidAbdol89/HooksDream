// Hook to track unread messages count for navigation badges
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useChat } from '@/hooks/useChat';

interface UnreadCount {
  messages: number;
  notifications: number;
}

interface ChatMessage {
  _id: string;
  sender: string;
  conversation: string;
  readBy?: string[];
  [key: string]: any;
}

export const useUnreadCount = (currentUserId?: string) => {
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({
    messages: 0,
    notifications: 0
  });

  const { socket } = useSocket();
  const { useConversations } = useChat();
  const { data: conversations } = useConversations();

  // Calculate unread messages from conversations using unreadCount field
  const calculateUnreadMessages = useCallback(() => {
    if (!conversations?.data) return 0;
    
    return conversations.data.reduce((total, conversation) => {
      // Use the unreadCount field from conversation
      return total + (conversation.unreadCount || 0);
    }, 0);
  }, [conversations]);

  // Update unread count when conversations change
  useEffect(() => {
    const messagesCount = calculateUnreadMessages();
    setUnreadCount(prev => ({
      ...prev,
      messages: Math.max(0, Number(messagesCount) || 0) // Ensure positive number
    }));
  }, [calculateUnreadMessages]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewMessage = (data: { conversationId: string; message: ChatMessage }) => {
      const { message } = data;
      // Only count if message is not from current user
      if (message.sender !== currentUserId) {
        // Directly increment count instead of relying on conversations data
        setUnreadCount(prev => ({
          ...prev,
          messages: prev.messages + 1
        }));
      }
    };

    const handleMessageRead = (data: { messageId: string; userId: string }) => {
      // Decrease count when current user reads a message
      if (data.userId === currentUserId) {
        setUnreadCount(prev => ({
          ...prev,
          messages: Math.max(0, prev.messages - 1)
        }));
      }
    };

    const handleConversationRead = (data: { conversationId: string; unreadCount?: number }) => {
      // Decrease unread count when conversation is marked as read
      if (typeof data.unreadCount === 'number') {
        // Use the exact unread count from server
        const totalUnread = calculateUnreadMessages();
        const newCount = Math.max(0, totalUnread - 1);
        setUnreadCount(prev => ({
          ...prev,
          messages: newCount
        }));
      } else {
        // Fallback: decrease by 1
        setUnreadCount(prev => ({
          ...prev,
          messages: Math.max(0, prev.messages - 1)
        }));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('chat:message:status', handleMessageRead);
    socket.on('conversation:updated', handleConversationRead);
    socket.on('conversation:read', handleConversationRead);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('chat:message:status', handleMessageRead);
      socket.off('conversation:updated', handleConversationRead);
      socket.off('conversation:read', handleConversationRead);
    };
  }, [socket, currentUserId, calculateUnreadMessages]);

  // Clear unread messages count
  const clearUnreadMessages = useCallback(() => {
    setUnreadCount(prev => ({
      ...prev,
      messages: 0
    }));
  }, []);

  // Clear unread notifications count
  const clearUnreadNotifications = useCallback(() => {
    setUnreadCount(prev => ({
      ...prev,
      notifications: 0
    }));
  }, []);

  return {
    unreadCount,
    clearUnreadMessages,
    clearUnreadNotifications
  };
};
