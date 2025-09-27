// hooks/useOnlineUsers.ts - Track online users and last seen
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useGoogleAuth } from './useGoogleAuth';

interface UserStatus {
  isOnline: boolean;
  lastSeen?: Date;
}

export const useOnlineUsers = () => {
  const { on, off, emit, isConnected } = useSocket();
  const { token } = useGoogleAuth();
  const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());
  const fetchingUsersRef = useRef<Set<string>>(new Set());

  // Listen for user status updates
  useEffect(() => {
    if (!isConnected) return;

    const handleUserStatus = (data: {
      userId: string;
      status: 'online' | 'offline';
      timestamp?: string;
    }) => {
      setUserStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, {
          isOnline: data.status === 'online',
          lastSeen: data.status === 'offline' ? new Date(data.timestamp || Date.now()) : undefined
        });
        return newMap;
      });
    };

    on('chat:user:status', handleUserStatus);
    emit('chat:status:online');

    return () => {
      off('chat:user:status', handleUserStatus);
    };
  }, [isConnected, on, off, emit]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string) => {
    return userStatuses.get(userId)?.isOnline || false;
  }, [userStatuses]);

  // Get user status with last seen
  const getUserStatus = useCallback((userId: string) => {
    const status = userStatuses.get(userId);
    
    // If no real-time status, try to fetch from database
    if (!status) {
      // Fetch from API in background (don't block UI)
      fetchUserStatusFromDB(userId);
      return { isOnline: false, lastSeenText: '' };
    }
    
    if (status.isOnline) {
      return { isOnline: true, lastSeenText: 'Active now' };
    }
    
    if (status.lastSeen) {
      const now = new Date();
      const diffMs = now.getTime() - status.lastSeen.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) {
        return { isOnline: false, lastSeenText: 'Last seen just now' };
      } else if (diffMinutes < 60) {
        return { isOnline: false, lastSeenText: `Last seen ${diffMinutes}m ago` };
      } else if (diffHours < 24) {
        return { isOnline: false, lastSeenText: `Last seen ${diffHours}h ago` };
      } else if (diffDays < 7) {
        return { isOnline: false, lastSeenText: `Last seen ${diffDays}d ago` };
      } else {
        return { isOnline: false, lastSeenText: 'Last seen a while ago' };
      }
    }
    
    return { isOnline: false, lastSeenText: '' };
  }, [userStatuses]);
  
  // Fetch user status from database
  const fetchUserStatusFromDB = useCallback(async (userId: string) => {
    if (!token || fetchingUsersRef.current.has(userId)) return;
    
    // Mark as fetching
    fetchingUsersRef.current.add(userId);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat/users/${userId}/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, {
              isOnline: data.data.isOnline,
              lastSeen: data.data.lastSeen ? new Date(data.data.lastSeen) : undefined
            });
            return newMap;
          });
        }
      }
    } catch (error) {
      // Silently handle error
    } finally {
      // Remove from fetching set
      fetchingUsersRef.current.delete(userId);
    }
  }, [token]);

  // Get online users count
  const getOnlineUsersCount = useCallback(() => {
    return Array.from(userStatuses.values()).filter(status => status.isOnline).length;
  }, [userStatuses]);

  return {
    isUserOnline,
    getUserStatus,
    getOnlineUsersCount
  };
};
