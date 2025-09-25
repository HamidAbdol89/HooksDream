// Lens Protocol Configuration
export const LENS_CONFIG = {
  APP_ID: 'lens-social-dapp',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: 'development', // 'development' | 'production'
  API_URL: 'https://api.lens.dev',
  EXPLORER_URL: 'https://explorer.lens.xyz',
} as const;

// Network Configuration
export const NETWORKS = {
  POLYGON: {
    chainId: '0x89',
    name: 'Polygon Mainnet',
    currency: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    explorer: 'https://polygonscan.com/',
  },
  POLYGON_MUMBAI: {
    chainId: '0x13881',
    name: 'Polygon Mumbai',
    currency: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    explorer: 'https://mumbai.polygonscan.com/',
  },
} as const;

// UI Constants
export const UI = {
  MAX_POST_LENGTH: 5000,
  MAX_HANDLE_LENGTH: 31,
  MIN_HANDLE_LENGTH: 3,
  NOTIFICATION_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  WALLET_CONNECTION: 'lens-wallet-connection',
  USER_PREFERENCES: 'lens-user-preferences',
  THEME: 'lens-theme',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_FOUND: 'No wallet found. Please install MetaMask or another Web3 wallet.',
  NETWORK_SWITCH_FAILED: 'Failed to switch network. Please try again.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please try again.',
  PROFILE_NOT_FOUND: 'Profile not found. Please create a new profile.',
  INVALID_HANDLE: 'Invalid handle format. Use only lowercase letters, numbers, dots, and underscores.',
  CONTENT_TOO_LONG: 'Content is too long. Maximum 5000 characters allowed.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully!',
  PROFILE_CREATED: 'Profile created successfully!',
  POST_CREATED: 'Post created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FOLLOWED: 'User followed successfully!',
  UNFOLLOWED: 'User unfollowed successfully!',
  LIKED: 'Post liked successfully!',
  UNLIKED: 'Post unliked successfully!',
} as const;
