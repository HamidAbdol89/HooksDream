// PWA Manager - Central management for all PWA features
import { indexedDBService } from './indexedDB';
import { pushService } from './pushService';
import { badgingService } from './badgingService';
import { wakeLockService } from './wakeLockService';
import { backgroundSyncService } from './backgroundSyncService';

export interface PWACapabilities {
  serviceWorker: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  badging: boolean;
  wakeLock: boolean;
  indexedDB: boolean;
  installable: boolean;
}

export interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  hasNotificationPermission: boolean;
  unreadCount: number;
  pendingActionsCount: number;
  storageUsage: {
    used: number;
    quota: number;
    percentage: number;
  };
}

class PWAManager {
  private installPromptEvent: any = null;
  private statusCallbacks: Array<(status: PWAStatus) => void> = [];

  constructor() {
    this.init();
  }

  // Initialize PWA Manager
  private async init(): Promise<void> {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e;
      console.log('PWA install prompt available');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.installPromptEvent = null;
      this.notifyStatusChange();
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      console.log('App is online');
      this.handleOnlineStatus();
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.notifyStatusChange();
    });

    // Initialize services
    await this.initializeServices();
  }

  // Initialize all PWA services
  private async initializeServices(): Promise<void> {
    try {
      // Initialize IndexedDB
      await indexedDBService.init();

      // Setup wake lock auto-management
      wakeLockService.setupAutoManagement();

      console.log('PWA services initialized');
    } catch (error) {
      console.error('Failed to initialize PWA services:', error);
    }
  }

  // Get PWA capabilities
  getCapabilities(): PWACapabilities {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: pushService.isSupported(),
      backgroundSync: backgroundSyncService.isSupported(),
      badging: badgingService.isSupported(),
      wakeLock: wakeLockService.isSupported(),
      indexedDB: 'indexedDB' in window,
      installable: this.installPromptEvent !== null
    };
  }

  // Get current PWA status
  async getStatus(): Promise<PWAStatus> {
    const [pendingActionsCount, storageUsage] = await Promise.all([
      backgroundSyncService.getPendingActionsCount(),
      indexedDBService.getStorageUsage()
    ]);

    return {
      isOnline: navigator.onLine,
      isInstalled: this.isInstalled(),
      hasNotificationPermission: pushService.getPermissionStatus() === 'granted',
      unreadCount: 0, // Will be updated by app
      pendingActionsCount,
      storageUsage
    };
  }

  // Check if app is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      this.installPromptEvent.prompt();
      const { outcome } = await this.installPromptEvent.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted install prompt');
        this.installPromptEvent = null;
        return true;
      } else {
        console.log('User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // Setup push notifications
  async setupPushNotifications(): Promise<boolean> {
    try {
      const subscription = await pushService.subscribe();
      if (subscription) {
        // Send subscription to backend
        await this.sendSubscriptionToBackend(subscription);
        return true;
      }
      // Silent fail if subscription is null (not supported/denied)
      return false;
    } catch (error) {
      // Silent fail for push service errors
      return false;
    }
  }

  // Send push subscription to backend
  private async sendSubscriptionToBackend(subscription: any): Promise<void> {
    const token = localStorage.getItem('google_auth_token');
    if (!token) return;

    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to send subscription to backend:', error);
    }
  }

  // Update app badge
  async updateBadge(unreadCount: number): Promise<void> {
    await badgingService.setMessagesBadge(unreadCount);
  }

  // Handle online status change
  private async handleOnlineStatus(): Promise<void> {
    if (navigator.onLine) {
      // Retry failed background sync actions
      await backgroundSyncService.retryFailedActions();
    }
  }

  // Subscribe to status changes
  onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  // Notify status change to subscribers
  private async notifyStatusChange(): Promise<void> {
    const status = await this.getStatus();
    this.statusCallbacks.forEach(callback => callback(status));
  }

  // Cleanup PWA resources
  cleanup(): void {
    wakeLockService.cleanup();
    this.statusCallbacks = [];
  }

  // Get PWA health report
  async getHealthReport(): Promise<{
    capabilities: PWACapabilities;
    status: PWAStatus;
    recommendations: string[];
  }> {
    const capabilities = this.getCapabilities();
    const status = await this.getStatus();
    const recommendations: string[] = [];

    // Generate recommendations
    if (!capabilities.pushNotifications) {
      recommendations.push('Enable push notifications for better engagement');
    }
    
    if (!status.hasNotificationPermission) {
      recommendations.push('Grant notification permission to receive updates');
    }
    
    if (!status.isInstalled && capabilities.installable) {
      recommendations.push('Install app to home screen for better experience');
    }
    
    if (status.storageUsage.percentage > 80) {
      recommendations.push('Clear cache to free up storage space');
    }
    
    if (status.pendingActionsCount > 10) {
      recommendations.push('Check internet connection - many actions are pending');
    }

    return {
      capabilities,
      status,
      recommendations
    };
  }
}

export const pwaManager = new PWAManager();
export default pwaManager;
