// Advanced IndexedDB service for PWA offline data persistence
// Note: Install 'idb' package with: npm install idb
// import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Temporary fallback using native IndexedDB until 'idb' package is installed
interface DBSchema {
  [key: string]: any;
}

interface IDBPDatabase<T extends DBSchema> {
  transaction(storeNames: string | string[], mode?: IDBTransactionMode): any;
  put(storeName: string, value: any): Promise<any>;
  get(storeName: string, key: any): Promise<any>;
  getAll(storeName: string): Promise<any[]>;
  getAllFromIndex(storeName: string, indexName: string, query?: any): Promise<any[]>;
  delete(storeName: string, key: any): Promise<void>;
}

// Fallback openDB function
const openDB = async <T extends DBSchema>(name: string, version: number, options?: any): Promise<IDBPDatabase<T>> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      resolve({
        transaction: (storeNames: string | string[], mode = 'readonly') => {
          const tx = db.transaction(storeNames, mode);
          return {
            store: tx.objectStore(Array.isArray(storeNames) ? storeNames[0] : storeNames),
            done: Promise.resolve()
          };
        },
        put: async (storeName: string, value: any) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.put(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        get: async (storeName: string, key: any) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        getAll: async (storeName: string) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        getAllFromIndex: async (storeName: string, indexName: string, query?: any) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const index = store.index(indexName);
          return new Promise((resolve, reject) => {
            const request = query ? index.getAll(query) : index.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        delete: async (storeName: string, key: any) => {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
      } as IDBPDatabase<T>);
    };
    
    if (options?.upgrade) {
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        options.upgrade(db);
      };
    }
  });
};

// Database schema definition
interface HooksDreamDB extends DBSchema {
  // User data cache
  users: {
    key: string; // user hashId
    value: {
      hashId: string;
      username: string;
      displayName: string;
      avatar: string;
      bio?: string;
      isFollowing?: boolean;
      followersCount: number;
      followingCount: number;
      postsCount: number;
      lastUpdated: number;
    };
    indexes: { 'by-username': string; 'by-updated': number };
  };

  // Posts cache
  posts: {
    key: string; // post _id
    value: {
      _id: string;
      content: string;
      images?: string[];
      video?: string;
      author: {
        hashId: string;
        username: string;
        displayName: string;
        avatar: string;
      };
      likesCount: number;
      commentsCount: number;
      repostsCount: number;
      isLiked: boolean;
      isReposted: boolean;
      createdAt: string;
      lastUpdated: number;
    };
    indexes: { 'by-author': string; 'by-created': string; 'by-updated': number };
  };

  // Messages cache
  messages: {
    key: string; // message _id
    value: {
      _id: string;
      conversationId: string;
      senderId: string;
      content?: string;
      type: 'text' | 'image' | 'video' | 'audio' | 'file';
      imageUrl?: string;
      videoUrl?: string;
      audioUrl?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      createdAt: string;
      status: 'sending' | 'sent' | 'delivered' | 'read';
      lastUpdated: number;
    };
    indexes: { 'by-conversation': string; 'by-created': string; 'by-status': string };
  };

  // Conversations cache
  conversations: {
    key: string; // conversation _id
    value: {
      _id: string;
      participants: Array<{
        hashId: string;
        username: string;
        displayName: string;
        avatar: string;
      }>;
      lastMessage?: {
        content: string;
        type: string;
        createdAt: string;
        senderId: string;
      };
      unreadCount: number;
      lastUpdated: number;
    };
    indexes: { 'by-updated': number };
  };

  // Pending actions for background sync
  pendingActions: {
    key: string; // action id
    value: {
      id: string;
      type: 'create-post' | 'send-message' | 'like-post' | 'follow-user' | 'upload-image';
      data: any;
      endpoint: string;
      method: 'POST' | 'PUT' | 'DELETE';
      retryCount: number;
      createdAt: number;
      lastAttempt?: number;
    };
    indexes: { 'by-type': string; 'by-created': number };
  };

  // App settings and preferences
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      lastUpdated: number;
    };
  };
}

class IndexedDBService {
  private db: IDBPDatabase<HooksDreamDB> | null = null;
  private readonly DB_NAME = 'HooksDreamDB';
  private readonly DB_VERSION = 1;

  // Initialize database
  async init(): Promise<void> {
    try {
      this.db = await openDB<HooksDreamDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db: IDBDatabase) {
          // Users store
          if (!db.objectStoreNames.contains('users')) {
            const usersStore = db.createObjectStore('users', { keyPath: 'hashId' });
            usersStore.createIndex('by-username', 'username');
            usersStore.createIndex('by-updated', 'lastUpdated');
          }

          // Posts store
          if (!db.objectStoreNames.contains('posts')) {
            const postsStore = db.createObjectStore('posts', { keyPath: '_id' });
            postsStore.createIndex('by-author', 'author.hashId');
            postsStore.createIndex('by-created', 'createdAt');
            postsStore.createIndex('by-updated', 'lastUpdated');
          }

          // Messages store
          if (!db.objectStoreNames.contains('messages')) {
            const messagesStore = db.createObjectStore('messages', { keyPath: '_id' });
            messagesStore.createIndex('by-conversation', 'conversationId');
            messagesStore.createIndex('by-created', 'createdAt');
            messagesStore.createIndex('by-status', 'status');
          }

          // Conversations store
          if (!db.objectStoreNames.contains('conversations')) {
            const conversationsStore = db.createObjectStore('conversations', { keyPath: '_id' });
            conversationsStore.createIndex('by-updated', 'lastUpdated');
          }

          // Pending actions store
          if (!db.objectStoreNames.contains('pendingActions')) {
            const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
            pendingStore.createIndex('by-type', 'type');
            pendingStore.createIndex('by-created', 'createdAt');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
      });

      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  // Ensure database is initialized
  private async ensureDB(): Promise<IDBPDatabase<HooksDreamDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // User operations
  async cacheUser(user: HooksDreamDB['users']['value']): Promise<void> {
    const db = await this.ensureDB();
    const userData = { ...user, lastUpdated: Date.now() };
    await db.put('users', userData);
  }

  async getCachedUser(hashId: string): Promise<HooksDreamDB['users']['value'] | null> {
    const db = await this.ensureDB();
    const user = await db.get('users', hashId);
    return user || null;
  }

  async searchCachedUsers(query: string, limit = 10): Promise<HooksDreamDB['users']['value'][]> {
    const db = await this.ensureDB();
    const users = await db.getAll('users');
    
    return users
      .filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }

  // Post operations
  async cachePosts(posts: HooksDreamDB['posts']['value'][]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('posts', 'readwrite');
    
    await Promise.all(
      posts.map(post => tx.store.put({ ...post, lastUpdated: Date.now() }))
    );
    
    await tx.done;
  }

  async getCachedPosts(limit = 20): Promise<HooksDreamDB['posts']['value'][]> {
    const db = await this.ensureDB();
    const posts = await db.getAllFromIndex('posts', 'by-created');
    return posts.reverse().slice(0, limit);
  }

  async getCachedPostsByUser(userHashId: string): Promise<HooksDreamDB['posts']['value'][]> {
    const db = await this.ensureDB();
    return await db.getAllFromIndex('posts', 'by-author', userHashId);
  }

  // Message operations
  async cacheMessages(messages: HooksDreamDB['messages']['value'][]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('messages', 'readwrite');
    
    await Promise.all(
      messages.map(message => tx.store.put({ ...message, lastUpdated: Date.now() }))
    );
    
    await tx.done;
  }

  async getCachedMessages(conversationId: string, limit = 50): Promise<HooksDreamDB['messages']['value'][]> {
    const db = await this.ensureDB();
    const messages = await db.getAllFromIndex('messages', 'by-conversation', conversationId);
    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-limit);
  }

  // Conversation operations
  async cacheConversations(conversations: HooksDreamDB['conversations']['value'][]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('conversations', 'readwrite');
    
    await Promise.all(
      conversations.map(conv => tx.store.put({ ...conv, lastUpdated: Date.now() }))
    );
    
    await tx.done;
  }

  async getCachedConversations(): Promise<HooksDreamDB['conversations']['value'][]> {
    const db = await this.ensureDB();
    const conversations = await db.getAllFromIndex('conversations', 'by-updated');
    return conversations.reverse();
  }

  // Pending actions for background sync
  async addPendingAction(action: Omit<HooksDreamDB['pendingActions']['value'], 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDB();
    const actionId = `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingAction: HooksDreamDB['pendingActions']['value'] = {
      id: actionId,
      ...action,
      retryCount: 0,
      createdAt: Date.now()
    };
    
    await db.put('pendingActions', pendingAction);
    return actionId;
  }

  async getPendingActions(): Promise<HooksDreamDB['pendingActions']['value'][]> {
    const db = await this.ensureDB();
    return await db.getAll('pendingActions');
  }

  async removePendingAction(actionId: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('pendingActions', actionId);
  }

  async updatePendingActionRetry(actionId: string): Promise<void> {
    const db = await this.ensureDB();
    const action = await db.get('pendingActions', actionId);
    
    if (action) {
      action.retryCount += 1;
      action.lastAttempt = Date.now();
      await db.put('pendingActions', action);
    }
  }

  // Settings operations
  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    await db.put('settings', {
      key,
      value,
      lastUpdated: Date.now()
    });
  }

  async getSetting(key: string): Promise<any> {
    const db = await this.ensureDB();
    const setting = await db.get('settings', key);
    return setting?.value;
  }

  // Cleanup old data
  async cleanup(): Promise<void> {
    const db = await this.ensureDB();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    // Clean old posts
    const oldPosts = await db.getAllFromIndex('posts', 'by-updated', IDBKeyRange.upperBound(oneWeekAgo));
    const tx1 = db.transaction('posts', 'readwrite');
    await Promise.all(oldPosts.map(post => tx1.store.delete(post._id)));
    await tx1.done;
    
    // Clean old messages (keep only last 1000 per conversation)
    const conversations = await db.getAll('conversations');
    for (const conv of conversations) {
      const messages = await db.getAllFromIndex('messages', 'by-conversation', conv._id);
      if (messages.length > 1000) {
        const toDelete = messages.slice(0, messages.length - 1000);
        const tx2 = db.transaction('messages', 'readwrite');
        await Promise.all(toDelete.map(msg => tx2.store.delete(msg._id)));
        await tx2.done;
      }
    }
    
    console.log('IndexedDB cleanup completed');
  }

  // Get storage usage
  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? Math.round((estimate.usage || 0) / estimate.quota * 100) : 0
      };
    }
    return { used: 0, quota: 0, percentage: 0 };
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

// Auto-initialize on import
indexedDBService.init().catch(console.error);

export default indexedDBService;
