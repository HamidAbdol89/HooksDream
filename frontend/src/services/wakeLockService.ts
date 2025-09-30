// Wake Lock API Service - Keep screen awake during important activities
type CustomWakeLockSentinel = {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
};

type CustomWakeLock = {
  request(type: 'screen'): Promise<CustomWakeLockSentinel>;
};

class WakeLockService {
  private wakeLock: CustomWakeLockSentinel | null = null;
  private isActive = false;

  // Check if Wake Lock API is supported
  isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  // Request wake lock to keep screen awake
  async requestWakeLock(reason?: string): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Wake Lock API is not supported');
      return false;
    }

    // Don't request if already active
    if (this.isActive && this.wakeLock && !this.wakeLock.released) {
      return true;
    }

    try {
      this.wakeLock = await navigator.wakeLock!.request('screen');
      this.isActive = true;

      console.log(`Wake lock acquired${reason ? ` for: ${reason}` : ''}`);

      // Listen for wake lock release
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake lock was released');
        this.isActive = false;
      });

      return true;
    } catch (error) {
      console.error('Failed to request wake lock:', error);
      this.isActive = false;
      return false;
    }
  }

  // Release wake lock
  async releaseWakeLock(): Promise<void> {
    if (this.wakeLock && !this.wakeLock.released) {
      try {
        await this.wakeLock.release();
        console.log('Wake lock released');
      } catch (error) {
        console.error('Failed to release wake lock:', error);
      }
    }
    
    this.wakeLock = null;
    this.isActive = false;
  }

  // Check if wake lock is currently active
  isWakeLockActive(): boolean {
    return this.isActive && !!this.wakeLock && !this.wakeLock.released;
  }

  // Request wake lock for video call
  async requestForVideoCall(): Promise<boolean> {
    return await this.requestWakeLock('video call');
  }

  // Request wake lock for voice call
  async requestForVoiceCall(): Promise<boolean> {
    return await this.requestWakeLock('voice call');
  }

  // Request wake lock for recording
  async requestForRecording(): Promise<boolean> {
    return await this.requestWakeLock('recording');
  }

  // Request wake lock for live streaming
  async requestForStreaming(): Promise<boolean> {
    return await this.requestWakeLock('live streaming');
  }

  // Auto-manage wake lock based on page visibility
  setupAutoManagement(): void {
    if (!this.isSupported()) return;

    // Release wake lock when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.isWakeLockActive()) {
        this.releaseWakeLock();
      }
    });

    // Re-request wake lock when page becomes visible (if it was active before)
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.isActive) {
        await this.requestWakeLock('page visibility change');
      }
    });
  }

  // Cleanup - release wake lock and remove listeners
  cleanup(): void {
    this.releaseWakeLock();
  }
}

export const wakeLockService = new WakeLockService();

// Auto-setup management on import
wakeLockService.setupAutoManagement();

export default wakeLockService;
