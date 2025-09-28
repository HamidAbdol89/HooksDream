// ✅ SINGLE SOURCE OF TRUTH - Profile Types
// Thay thế tất cả các duplicate type definitions

export interface ProfileFormData {
  displayName: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  pronouns?: string;
}

export interface ProfileFormErrors {
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  email?: string;
  phone?: string;
  pronouns?: string;
}

export type ActiveTab = 'basic' | 'images' | 'social' | 'account';

// ✅ Validation constants - sync với backend
export const VALIDATION_RULES = {
  displayName: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  bio: {
    maxLength: 160
  },
  location: {
    maxLength: 100
  },
  website: {
    // ✅ Sync với backend - cho phép không có protocol
    pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/
  },
  pronouns: {
    maxLength: 30
  }
} as const;

// ✅ File upload constants - sync với backend
export const FILE_UPLOAD = {
  avatar: {
    maxSize: 10 * 1024 * 1024, // 10MB - sync với backend
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    recommendedSize: '400×400px'
  },
  coverImage: {
    maxSize: 10 * 1024 * 1024, // 10MB - sync với backend  
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    recommendedSize: '1200×400px'
  }
} as const;

// ✅ API endpoints - sync với backend routes
export const PROFILE_API = {
  updateProfile: (hashId: string) => `/api/users/profile/${hashId}`,
  uploadImage: (hashId: string) => `/api/users/profile/${hashId}`,
  getProfile: (userId: string) => `/api/users/profile/${userId}`,
  getCurrentProfile: () => `/api/users/profile/me`
} as const;

// ✅ Helper functions
export const isCloudinaryUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

export const addCacheBusting = (url?: string): string => {
  if (!url) return '';
  if (url.includes('?t=')) return url;
  return `${url}?t=${Date.now()}`;
};

// ✅ Convert functions để tương thích với useAppStore
export const convertToProfileFormData = (user: any): ProfileFormData => {
  return {
    displayName: user.displayName || user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    avatar: user.avatar || '',
    coverImage: user.coverImage || '',
    email: user.email || '',
    phone: user.phone || '',
    pronouns: user.pronouns || ''
  };
};
