// PWA API Type Declarations
declare global {
  // Wake Lock API
  interface Navigator {
    wakeLock?: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }

  interface WakeLockSentinel {
    readonly released: boolean;
    readonly type: 'screen';
    release(): Promise<void>;
    addEventListener(type: 'release', listener: () => void): void;
    removeEventListener(type: 'release', listener: () => void): void;
  }

  // Background Sync API
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }

  // Badging API
  interface Navigator {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }

  // Install Prompt Event
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  // File System Access API
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    name: string;
    kind: 'file';
  }

  // Share API
  interface Navigator {
    share?: (data: {
      title?: string;
      text?: string;
      url?: string;
      files?: File[];
    }) => Promise<void>;
  }

  // Web Locks API
  interface Navigator {
    locks?: {
      request(name: string, callback: () => Promise<any>): Promise<any>;
      request(name: string, options: { mode?: 'exclusive' | 'shared' }, callback: () => Promise<any>): Promise<any>;
    };
  }

  // Persistent Storage API
  interface StorageManager {
    persist?(): Promise<boolean>;
    persisted?(): Promise<boolean>;
  }

  // Screen Orientation API
  interface Screen {
    orientation?: {
      lock(orientation: OrientationLockType): Promise<void>;
      unlock(): void;
      readonly angle: number;
      readonly type: OrientationType;
      addEventListener(type: 'change', listener: () => void): void;
      removeEventListener(type: 'change', listener: () => void): void;
    };
  }

  type OrientationLockType = 
    | 'any'
    | 'natural'
    | 'landscape'
    | 'portrait'
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary';

  type OrientationType =
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary';

  // Contact Picker API
  interface Navigator {
    contacts?: {
      select(properties: string[], options?: { multiple?: boolean }): Promise<ContactInfo[]>;
      getProperties(): Promise<string[]>;
    };
  }

  interface ContactInfo {
    address?: ContactAddress[];
    email?: string[];
    icon?: Blob[];
    name?: string[];
    tel?: string[];
  }

  interface ContactAddress {
    addressLine?: string[];
    city?: string;
    country?: string;
    dependentLocality?: string;
    languageCode?: string;
    organization?: string;
    phone?: string;
    postalCode?: string;
    recipient?: string;
    region?: string;
    sortingCode?: string;
  }
}

export {};
