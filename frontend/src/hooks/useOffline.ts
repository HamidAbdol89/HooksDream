import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  posts: any[];
  messages: any[];
  actions: any[];
}

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    posts: [],
    messages: [],
    actions: []
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeOfflineAction = useCallback((action: any) => {
    const storedActions = JSON.parse(localStorage.getItem('offline-actions') || '[]');
    storedActions.push({
      ...action,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
    localStorage.setItem('offline-actions', JSON.stringify(storedActions));
    
    setOfflineData(prev => ({
      ...prev,
      actions: storedActions
    }));
  }, []);

  const syncOfflineData = useCallback(async () => {
    const storedActions = JSON.parse(localStorage.getItem('offline-actions') || '[]');
    
    for (const action of storedActions) {
      try {
        await executeOfflineAction(action);
        // Remove successful action
        const updatedActions = storedActions.filter((a: any) => a.id !== action.id);
        localStorage.setItem('offline-actions', JSON.stringify(updatedActions));
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  }, []);

  const executeOfflineAction = async (action: any) => {
    switch (action.type) {
      case 'CREATE_POST':
        return fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      
      case 'SEND_MESSAGE':
        return fetch(`/api/chat/conversations/${action.conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      
      case 'LIKE_POST':
        return fetch(`/api/posts/${action.postId}/like`, {
          method: 'POST'
        });
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  return {
    isOnline,
    offlineData,
    storeOfflineAction,
    syncOfflineData
  };
};
