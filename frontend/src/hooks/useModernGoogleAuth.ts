// useModernGoogleAuth.ts - Modern Google Authentication Hook
// Optimized for performance, mobile-first UX, and reliability

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

// Auth states for better UX
export const AuthState = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  AUTHENTICATING: 'authenticating',
  LOADING_PROFILE: 'loading_profile',
  FINALIZING: 'finalizing',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type AuthState = typeof AuthState[keyof typeof AuthState];

// Error types for better error handling
export const AuthErrorType = {
  SCRIPT_LOAD_FAILED: 'script_load_failed',
  GOOGLE_INIT_FAILED: 'google_init_failed',
  AUTHENTICATION_FAILED: 'authentication_failed',
  NETWORK_ERROR: 'network_error',
  TOKEN_INVALID: 'token_invalid',
  USER_CANCELLED: 'user_cancelled'
} as const;

export type AuthErrorType = typeof AuthErrorType[keyof typeof AuthErrorType];

export interface AuthError {
  type: AuthErrorType;
  message: string;
  canRetry: boolean;
  retryAction?: () => void;
}

export interface AuthProgress {
  state: AuthState;
  message: string;
  progress: number; // 0-100
}

export interface ModernGoogleAuthContext {
  // States
  authState: AuthState;
  isLoading: boolean;
  isConnected: boolean;
  error: AuthError | null;
  progress: AuthProgress;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  
  // Data
  profile: any;
  token: string | null;
  
  // Utils
  getAuthHeaders: () => Record<string, string>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Progress messages for better UX
const PROGRESS_MESSAGES = {
  [AuthState.IDLE]: "Ready to sign in",
  [AuthState.INITIALIZING]: "Setting up authentication...",
  [AuthState.AUTHENTICATING]: "Signing in with Google...",
  [AuthState.LOADING_PROFILE]: "Loading your profile...",
  [AuthState.FINALIZING]: "Almost ready...",
  [AuthState.SUCCESS]: "Welcome back!",
  [AuthState.ERROR]: "Something went wrong"
};

const PROGRESS_VALUES = {
  [AuthState.IDLE]: 0,
  [AuthState.INITIALIZING]: 20,
  [AuthState.AUTHENTICATING]: 40,
  [AuthState.LOADING_PROFILE]: 70,
  [AuthState.FINALIZING]: 90,
  [AuthState.SUCCESS]: 100,
  [AuthState.ERROR]: 0
};

export const useModernGoogleAuth = (): ModernGoogleAuthContext => {
  // States
  const [authState, setAuthState] = useState<AuthState>(AuthState.IDLE);
  const [error, setError] = useState<AuthError | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for cleanup
  const initializationRef = useRef<boolean>(false);
  const cleanupRef = useRef<(() => void)[]>([]);
  
  // App store
  const { 
    setIsConnected, 
    setProfile, 
    setUser,
    isConnected,
    profile,
    user
  } = useAppStore();

  // Computed values
  const isLoading = authState === AuthState.INITIALIZING || 
                   authState === AuthState.AUTHENTICATING || 
                   authState === AuthState.LOADING_PROFILE || 
                   authState === AuthState.FINALIZING;

  const progress: AuthProgress = {
    state: authState,
    message: PROGRESS_MESSAGES[authState],
    progress: PROGRESS_VALUES[authState]
  };

  // Utility functions
  const createError = useCallback((type: AuthErrorType, message: string, canRetry = true): AuthError => ({
    type,
    message,
    canRetry,
    retryAction: canRetry ? retry : undefined
  }), []);

  const updateAuthState = useCallback((newState: AuthState) => {
    setAuthState(newState);
    if (newState !== AuthState.ERROR) {
      setError(null);
    }
  }, []);

  // Enhanced script loading with proper error handling
  const loadGoogleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.getElementById('google-auth-script');
      if (existingScript) {
        const checkGoogle = () => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.id = 'google-auth-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait for Google object to be fully available
        const checkGoogle = () => {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            setTimeout(checkGoogle, 50);
          }
        };
        checkGoogle();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Authentication script'));
      };
      
      document.head.appendChild(script);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google script loading timeout'));
      }, 10000);
    });
  }, []);

  // Initialize Google Auth with One Tap
  const initializeGoogleAuth = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      updateAuthState(AuthState.INITIALIZING);
      
      // Load Google script
      await loadGoogleScript();
      
      // Initialize Google Identity Services
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not available');
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        // Remove FedCM to avoid CORS issues
        // use_fedcm_for_prompt: false,
      });

      // Check for existing token
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        setToken(savedToken);
        await validateAndLoadUser(savedToken);
      } else {
        updateAuthState(AuthState.IDLE);
      }

    } catch (error) {
      console.error('Google Auth initialization failed:', error);
      setError(createError(
        AuthErrorType.GOOGLE_INIT_FAILED,
        'Failed to initialize Google Authentication. Please refresh the page.',
        true
      ));
      updateAuthState(AuthState.ERROR);
    }
  }, [createError, updateAuthState]);

  // Handle Google credential response
  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      updateAuthState(AuthState.AUTHENTICATING);

      // Send credential to backend
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: response.credential
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Authentication failed (${backendResponse.status})`);
      }

      updateAuthState(AuthState.LOADING_PROFILE);

      const data = await backendResponse.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Invalid response from server');
      }

      updateAuthState(AuthState.FINALIZING);

      // Extract data
      const { user: userData, token: jwtToken, profile: profileData } = data.data;
      
      if (!userData || !jwtToken) {
        throw new Error('Incomplete authentication data received');
      }

      // Save token
      setToken(jwtToken);
      localStorage.setItem('auth_token', jwtToken);
      
      // Update app state in single batch
      setUser(userData);
      setProfile(profileData || userData);
      setIsConnected(true);
      
      updateAuthState(AuthState.SUCCESS);
      
      // Reset retry count on success
      setRetryCount(0);

    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Clear any partial state
      setToken(null);
      localStorage.removeItem('auth_token');
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(createError(
        AuthErrorType.AUTHENTICATION_FAILED,
        errorMessage,
        true
      ));
      updateAuthState(AuthState.ERROR);
    }
  }, [createError, updateAuthState, setUser, setProfile, setIsConnected]);

  // Validate existing token and load user
  const validateAndLoadUser = useCallback(async (authToken: string) => {
    try {
      updateAuthState(AuthState.LOADING_PROFILE);

      const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token validation failed (${response.status})`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid user data received');
      }

      // Update app state
      setUser(data.data);
      setProfile(data.data);
      setIsConnected(true);
      
      updateAuthState(AuthState.SUCCESS);

    } catch (error) {
      console.error('Token validation failed:', error);
      
      // Clear invalid token
      setToken(null);
      localStorage.removeItem('auth_token');
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      
      updateAuthState(AuthState.IDLE);
    }
  }, [updateAuthState, setUser, setProfile, setIsConnected]);

  // Login function with One Tap and fallback
  const login = useCallback(async () => {
    try {
      setError(null);
      updateAuthState(AuthState.AUTHENTICATING);

      if (!window.google?.accounts?.id) {
        throw new Error('Google Authentication not initialized');
      }

      // Use standard button approach to avoid CORS/FedCM issues
      // One Tap can cause CORS errors in development
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(
          buttonElement,
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: buttonElement.offsetWidth || 320
          }
        );
      } else {
        // If no button element, create a manual trigger
        console.log('Google Sign-In ready - waiting for user interaction');
      }

    } catch (error) {
      console.error('Login failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(createError(
        AuthErrorType.AUTHENTICATION_FAILED,
        errorMessage,
        true
      ));
      updateAuthState(AuthState.ERROR);
    }
  }, [createError, updateAuthState]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      updateAuthState(AuthState.INITIALIZING);
      
      // Clear local state
      setToken(null);
      localStorage.removeItem('auth_token');
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      
      // Sign out from Google
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      // Optional: Call backend logout
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          // Ignore backend logout errors
        }
      }

      updateAuthState(AuthState.IDLE);

    } catch (error) {
      console.error('Logout failed:', error);
      updateAuthState(AuthState.IDLE); // Force idle state
    }
  }, [token, updateAuthState, setIsConnected, setUser, setProfile]);

  // Retry function with exponential backoff
  const retry = useCallback(async () => {
    if (retryCount >= 3) {
      setError(createError(
        AuthErrorType.AUTHENTICATION_FAILED,
        'Maximum retry attempts reached. Please refresh the page.',
        false
      ));
      return;
    }

    setRetryCount(prev => prev + 1);
    
    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Reset state and try again
    setError(null);
    updateAuthState(AuthState.IDLE);
    
    if (authState === AuthState.ERROR) {
      await login();
    }
  }, [retryCount, authState, login, createError, updateAuthState]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    if (authState === AuthState.ERROR) {
      updateAuthState(AuthState.IDLE);
    }
  }, [authState, updateAuthState]);

  // Get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }, [token]);

  // Initialize on mount
  useEffect(() => {
    initializeGoogleAuth();
    
    // Cleanup function
    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [initializeGoogleAuth]);

  return {
    // States
    authState,
    isLoading,
    isConnected,
    error,
    progress,
    
    // Actions
    login,
    logout,
    retry,
    clearError,
    
    // Data
    profile,
    token,
    
    // Utils
    getAuthHeaders,
  };
};

// Global types
declare global {
  interface Window {
    google: any;
  }
}
