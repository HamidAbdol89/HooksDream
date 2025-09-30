// Chat Push Notifications Hook - Tích hợp push notifications cho chat
import { useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { pushService } from '@/services/pushService';
import { badgingService } from '@/services/badgingService';
import { indexedDBService } from '@/services/indexedDB';

interface ChatMessage {
  _id: string;
  sender: string; // Backend uses 'sender', not 'senderId'
  content: {
    text?: string;
    image?: string;
    file?: any;
  };
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  conversation: string; // Backend uses 'conversation', not 'conversationId'
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
  const handleNewMessage = useCallback(async (data: { conversationId: string; message: ChatMessage }) => {
    const { message } = data;
    
    // Don't show notification for own messages
    if (message.sender === currentUserId) {
      return;
    }

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
      if (!pushService.isSupported()) {
        // Fallback: Show browser notification if possible
        if ('Notification' in window && Notification.permission === 'granted') {
          const { senderInfo } = message;
          const senderName = senderInfo?.displayName || senderInfo?.username || 'Someone';
          const notificationBody = message.content.text || 'Sent a message';
          
          new Notification(`💬 ${senderName}`, {
            body: notificationBody,
            icon: senderInfo?.avatar || '/default-avatar.jpg',
            tag: `chat-${message.conversation}`
          });
        }
        return;
      }
      
      if (pushService.getPermissionStatus() !== 'granted') {
        return;
      }

      const { senderInfo } = message;
      const senderName = senderInfo?.displayName || senderInfo?.username || 'Someone';
      
      let notificationBody = '';
      let notificationIcon = senderInfo?.avatar || '/default-avatar.jpg';

      // Format notification based on message type
      switch (message.type) {
        case 'text':
          notificationBody = message.content.text || 'Sent a message';
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
          tag: `chat-${message.conversation}`, // Group notifications by conversation
          data: {
            conversationId: message.conversation,
            messageId: message._id,
            senderId: message.sender,
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
      // Silent fail - don't spam console
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
      // Silent fail
    }
  };

  // Cache message for offline access
  const cacheMessage = async (message: ChatMessage) => {
    try {
      await indexedDBService.cacheMessages([{
        _id: message._id,
        conversationId: message.conversation,
        senderId: message.sender,
        content: message.content.text || '',
        type: message.type,
        createdAt: message.createdAt,
        status: 'delivered',
        lastUpdated: Date.now()
      }]);
    } catch (error) {
      // Silent fail
    }
  };

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // Listen for new messages (FIXED: correct event name)
    socket.on('message:new', handleNewMessage);
    
    // Listen for message status updates (FIXED: correct event name)
    socket.on('chat:message:status', async (data: { messageId: string; status: string }) => {
      // Update badge when messages are read
      if (data.status === 'read') {
        await updateUnreadBadge();
      }
    });

    // Cleanup listeners
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('chat:message:status');
    };
  }, [socket, currentUserId, handleNewMessage]);

  // Clear badge when user opens messages
  const clearUnreadBadge = useCallback(async () => {
    await badgingService.clearBadge();
  }, []);

  // Request push notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      // Check if supported
      if (!pushService.isSupported()) {
        // Try to request basic notification permission for fallback
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      }
      
      // Check current permission
      const currentPermission = pushService.getPermissionStatus();
      
      if (currentPermission === 'denied') {
        return false;
      }
      
      if (currentPermission === 'granted') {
        return true;
      }
      
      const subscription = await pushService.subscribe();
      return !!subscription;
    } catch (error) {
      // Fallback: Try basic notification permission
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        } catch (fallbackError) {
          // Silent fail
        }
      }
      
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
