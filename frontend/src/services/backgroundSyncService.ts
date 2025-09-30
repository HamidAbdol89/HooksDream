// Background Sync Service - Queue actions for offline execution
import { indexedDBService } from './indexedDB';

// Background Sync API types
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}

export interface SyncAction {
  id: string;
  type: 'create-post' | 'send-message' | 'like-post' | 'follow-user' | 'upload-image';
  data: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
}

class BackgroundSyncService {
  private readonly SYNC_TAGS = {
    POSTS: 'background-sync-posts',
    MESSAGES: 'background-sync-messages',
    INTERACTIONS: 'background-sync-interactions',
    UPLOADS: 'background-sync-uploads'
  };

  // Check if Background Sync is supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in (window.ServiceWorkerRegistration?.prototype || {});
  }

  // Queue action for background sync
  async queueAction(action: Omit<SyncAction, 'id'>): Promise<string> {
    // Store action in IndexedDB
    const actionId = await indexedDBService.addPendingAction(action);

    // Register background sync if supported
    if (this.isSupported()) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const syncTag = this.getSyncTagForAction(action.type);
        await registration.sync?.register(syncTag);
        
        console.log(`Background sync registered for: ${action.type}`);
      } catch (error) {
        console.error('Failed to register background sync:', error);
        // Fallback: try to execute immediately
        this.executeActionImmediately(actionId, action);
      }
    } else {
      // Fallback: try to execute immediately
      this.executeActionImmediately(actionId, action);
    }

    return actionId;
  }

  // Get appropriate sync tag for action type
  private getSyncTagForAction(actionType: SyncAction['type']): string {
    switch (actionType) {
      case 'create-post':
        return this.SYNC_TAGS.POSTS;
      case 'send-message':
        return this.SYNC_TAGS.MESSAGES;
      case 'like-post':
      case 'follow-user':
        return this.SYNC_TAGS.INTERACTIONS;
      case 'upload-image':
        return this.SYNC_TAGS.UPLOADS;
      default:
        return this.SYNC_TAGS.INTERACTIONS;
    }
  }

  // Execute action immediately (fallback)
  private async executeActionImmediately(actionId: string, action: Omit<SyncAction, 'id'>): Promise<void> {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...action.headers
        },
        body: JSON.stringify(action.data)
      });

      if (response.ok) {
        // Remove from pending actions
        await indexedDBService.removePendingAction(actionId);
        console.log(`Action executed successfully: ${action.type}`);
      } else {
        // Update retry count
        await indexedDBService.updatePendingActionRetry(actionId);
        console.error(`Action failed: ${action.type}`, response.status);
      }
    } catch (error) {
      // Update retry count
      await indexedDBService.updatePendingActionRetry(actionId);
      console.error(`Action error: ${action.type}`, error);
    }
  }

  // Queue post creation
  async queueCreatePost(postData: any, authToken: string): Promise<string> {
    return await this.queueAction({
      type: 'create-post',
      data: postData,
      endpoint: '/api/posts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  // Queue message sending
  async queueSendMessage(messageData: any, conversationId: string, authToken: string): Promise<string> {
    return await this.queueAction({
      type: 'send-message',
      data: messageData,
      endpoint: `/api/chat/conversations/${conversationId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  // Queue like action
  async queueLikePost(postId: string, authToken: string): Promise<string> {
    return await this.queueAction({
      type: 'like-post',
      data: { postId },
      endpoint: `/api/posts/${postId}/like`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  // Queue follow action
  async queueFollowUser(userHashId: string, authToken: string): Promise<string> {
    return await this.queueAction({
      type: 'follow-user',
      data: { userHashId },
      endpoint: `/api/users/${userHashId}/follow`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  // Get pending actions count
  async getPendingActionsCount(): Promise<number> {
    const actions = await indexedDBService.getPendingActions();
    return actions.length;
  }

  // Get pending actions by type
  async getPendingActionsByType(type: SyncAction['type']): Promise<any[]> {
    const actions = await indexedDBService.getPendingActions();
    return actions.filter(action => action.type === type);
  }

  // Manually retry failed actions
  async retryFailedActions(): Promise<void> {
    const actions = await indexedDBService.getPendingActions();
    const failedActions = actions.filter(action => action.retryCount > 0);

    for (const action of failedActions) {
      await this.executeActionImmediately(action.id, action);
    }
  }

  // Clear all pending actions (use with caution)
  async clearAllPendingActions(): Promise<void> {
    const actions = await indexedDBService.getPendingActions();
    
    for (const action of actions) {
      await indexedDBService.removePendingAction(action.id);
    }
    
    console.log('All pending actions cleared');
  }
}

export const backgroundSyncService = new BackgroundSyncService();
export default backgroundSyncService;
