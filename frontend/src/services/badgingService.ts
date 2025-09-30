// Badging API Service - Show notification badges on app icon
declare global {
  interface Navigator {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

class BadgingService {
  // Check if Badging API is supported
  isSupported(): boolean {
    return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
  }

  // Set badge count on app icon
  async setBadge(count?: number): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Badging API is not supported');
      return;
    }

    try {
      await navigator.setAppBadge?.(count);
      console.log(`Badge set to: ${count || 'flag'}`);
    } catch (error) {
      console.error('Failed to set app badge:', error);
    }
  }

  // Clear badge from app icon
  async clearBadge(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Badging API is not supported');
      return;
    }

    try {
      await navigator.clearAppBadge?.();
      console.log('Badge cleared');
    } catch (error) {
      console.error('Failed to clear app badge:', error);
    }
  }

  // Set badge for unread messages
  async setMessagesBadge(unreadCount: number): Promise<void> {
    if (unreadCount > 0) {
      await this.setBadge(unreadCount);
    } else {
      await this.clearBadge();
    }
  }

  // Set badge for notifications
  async setNotificationsBadge(notificationCount: number): Promise<void> {
    if (notificationCount > 0) {
      await this.setBadge(notificationCount);
    } else {
      await this.clearBadge();
    }
  }

  // Update badge based on app state
  async updateBadge(data: {
    unreadMessages?: number;
    notifications?: number;
    total?: number;
  }): Promise<void> {
    const { unreadMessages = 0, notifications = 0, total } = data;
    
    // Use total if provided, otherwise sum messages and notifications
    const badgeCount = total !== undefined ? total : unreadMessages + notifications;
    
    if (badgeCount > 0) {
      await this.setBadge(badgeCount);
    } else {
      await this.clearBadge();
    }
  }
}

export const badgingService = new BadgingService();
export default badgingService;
