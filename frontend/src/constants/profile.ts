// Field length limits
export const FIELD_LIMITS = {
  displayName: 50,
  username: 20,
  bio: 160,
  location: 50,
  pronouns: 30,
  website: 200
} as const;

// File size limits
export const FILE_LIMITS = {
  avatar: 2 * 1024 * 1024, // 2MB
  cover: 5 * 1024 * 1024   // 5MB
} as const;

// Image compression settings
export const IMAGE_COMPRESSION = {
  avatar: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8
  },
  cover: {
    maxWidth: 2000,
    maxHeight: 600,
    quality: 0.8
  }
} as const;

// Default values
export const DEFAULT_AVATAR = '/default-avatar.png';

// Validation patterns
export const VALIDATION_PATTERNS = {
  username: /^[a-zA-Z0-9_]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s+\-()]{10,20}$/,
  website: /^https?:\/\/.+/
} as const;

// Tab configuration
export const TABS = [
  { id: 'basic', label: 'Thông tin cơ bản', description: 'Tên, bio và địa điểm' },
  { id: 'images', label: 'Hình ảnh', description: 'Ảnh đại diện và ảnh bìa' },
  { id: 'social', label: 'Mạng xã hội', description: 'Website và liên kết mạng xã hội' },
  { id: 'account', label: 'Tài khoản', description: 'Email và thông tin liên hệ' }
] as const;