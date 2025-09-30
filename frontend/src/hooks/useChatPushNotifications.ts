// Chat Push Notifications Hook - Tích hợp push notifications cho chat
import { useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { pushService } from '@/services/pushService';
import { badgingService } from '@/services/badgingService';
import { indexedDBService } from '@/services/indexedDB';

interface ChatMessage {
  _id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  conversationId: string;
  createdAt: string;
  senderInfo?: {
    username: string;
    displayName: string;
    avatar: string;
  };
}

export const useChatPushNotifications = (currentUserId?: string) => {
  const { socket } = useSocket();

  // Handle incoming messages for push notifications
  const handleNewMessage = useCallback(async (message: ChatMessage) => {
    // Don't show notification for own messages
    if (message.senderId === currentUserId) return;

    // Check if user is currently viewing this conversation
    const isCurrentlyViewing = window.location.pathname.includes('/messages') && 
                              document.visibilityState === 'visible';

    // Only show push notification if user is not actively viewing the conversation
    if (!isCurrentlyViewing) {
      await showMessageNotification(message);
    }

    // Always update badge count
    await updateUnreadBadge();

    // Cache message for offline access
    await cacheMessage(message);
  }, [currentUserId]);

  // Show push notification for new message
  const showMessageNotification = async (message: ChatMessage) => {
    try {
      // Check if push notifications are supported and permitted
      if (!pushService.isSupported() || pushService.getPermissionStatus() !== 'granted') {
        return;
      }

      const { senderInfo } = message;
      const senderName = senderInfo?.displayName || senderInfo?.username || 'Someone';
      
      let notificationBody = '';
      let notificationIcon = senderInfo?.avatar || '/default-avatar.jpg';

      // Format notification based on message type
      switch (message.type) {
        case 'text':
          notificationBody = message.content;
          break;
        case 'image':
          notificationBody = '📷 Sent a photo';
          break;
        case 'video':
          notificationBody = '🎥 Sent a video';
          break;
        case 'audio':
          notificationBody = '🎵 Sent a voice message';
          break;
        case 'file':
          notificationBody = '📎 Sent a file';
          break;
        default:
          notificationBody = 'Sent a message';
      }

      // Show notification using service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(`${senderName}`, {
          body: notificationBody,
          icon: notificationIcon,
          badge: '/badge-72x72.png',
          tag: `chat-${message.conversationId}`, // Group notifications by conversation
          data: {
            conversationId: message.conversationId,
            messageId: message._id,
            senderId: message.senderId,
            type: 'chat-message'
          },
          vibrate: [100, 50, 100],
          requireInteraction: false,
          silent: false
        } as NotificationOptions & { 
          actions?: Array<{ action: string; title: string; icon?: string }> 
        });
      }
    } catch (error) {
      console.error('Failed to show message notification:', error);
    }
  };

  // Update unread badge count
  const updateUnreadBadge = async () => {
    try {
      // Get unread conversations count from IndexedDB or API
      const conversations = await indexedDBService.getCachedConversations();
      const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      
      // Update app badge
      await badgingService.setMessagesBadge(unreadCount);
    } catch (error) {
      console.error('Failed to update unread badge:', error);
    }
  };

  // Cache message for offline access
  const cacheMessage = async (message: ChatMessage) => {
    try {
      await indexedDBService.cacheMessages([{
        _id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        status: 'delivered',
        lastUpdated: Date.now()
      }]);
    } catch (error) {
      console.error('Failed to cache message:', error);
    }
  };

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // Listen for new messages
    socket.on('new-message', handleNewMessage);
    
    // Listen for message status updates
    socket.on('message-status-updated', async (data: { messageId: string; status: string }) => {
      // Update badge when messages are read
      if (data.status === 'read') {
        await updateUnreadBadge();
      }
    });

    // Cleanup listeners
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-status-updated');
    };
  }, [socket, currentUserId, handleNewMessage]);

  // Clear badge when user opens messages
  const clearUnreadBadge = useCallback(async () => {
    await badgingService.clearBadge();
  }, []);

  // Request push notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      const subscription = await pushService.subscribe();
      return !!subscription;
    } catch (error) {
      console.error('Failed to setup push notifications:', error);
      return false;
    }
  }, []);

  return {
    requestNotificationPermission,
    clearUnreadBadge,
    updateUnreadBadge
  };
};

export default useChatPushNotifications;
