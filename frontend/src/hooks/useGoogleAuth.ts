// useGoogleAuth.ts - Google OAuth Authentication Hook

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { persistentAuth } from "@/utils/persistentAuth";

// Google Auth Context Interface
export interface GoogleAuthContext {
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isConnected: boolean;
  getAuthHeaders: () => Record<string, string>;
  profile: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
    displayName?: string;
  } | null;
  refreshUserData: () => Promise<void>;
  token: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Global editing state management
let globalEditingState = false;

export const setGlobalEditingState = (editing: boolean) => {
  globalEditingState = editing;
};

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);

  const { 
    setIsConnected, 
    setProfile, 
    setUser,
    isConnected,
    profile,
    user
  } = useAppStore();

  // Initialize Google Auth
  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        // Load Google Identity Services
        if (!window.google) {
          await loadGoogleScript();
        }

        // Initialize Google Auth - check if google is available
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        } else {
          throw new Error('Google Identity Services not loaded');
        }

        // ✅ Check for persistent session first (30 days)
        const { SessionManager } = await import('@/utils/sessionManager');
        const savedSession = SessionManager.getAuthSession();
        
        if (savedSession && !hasInitialLoadCompleted) {
          setToken(savedSession.token);
          setUser(savedSession.user);
          setProfile(savedSession.profile);
          setIsConnected(true);
          setHasInitialLoadCompleted(true);
          setIsLoading(false);
          return;
        }

        // Fallback: Check for legacy token
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken && !hasInitialLoadCompleted) {
          setToken(savedToken);
          await loadUserFromToken(savedToken, true);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };

    initGoogleAuth();
  }, [hasInitialLoadCompleted]);

  // Load Google Script
  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-auth-script')) {
        // Wait for google object to be available
        const checkGoogle = () => {
          if (window.google && window.google.accounts) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-auth-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        // Wait for google object to be fully loaded
        const checkGoogle = () => {
          if (window.google && window.google.accounts) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };
      script.onerror = () => reject(new Error('Failed to load Google Auth script'));
      document.head.appendChild(script);
    });
  };

  // Handle Google credential response
  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);

      // Send ID token to backend
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: response.credential
        }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Google login failed');
      }

      const data = await backendResponse.json();
      
      if (data.success) {
        // Handle different response structures
        const userData = data.data?.user || data.user || data.data;
        const jwtToken = data.data?.token || data.token;
        
        if (!userData || !jwtToken) {
          throw new Error('Invalid response structure');
        }
        
        // ✅ Save token with 30-day persistent session
        setToken(jwtToken);
        const { SessionManager } = await import('@/utils/sessionManager');
        SessionManager.saveAuthSession(jwtToken, userData, userData);
        
        // Update app state
        await updateAppState(userData, jwtToken, true);
        
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      setIsConnected(false);
      setToken(null);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user from saved token
  const loadUserFromToken = async (authToken: string, isInitialLoad: boolean = false) => {
    // Skip if editing profile (except initial load)
    if (globalEditingState && !isInitialLoad) {
      return;
    }

    try {
      // Validate token with backend using the correct endpoint
      const response = await fetch(`${API_BASE_URL}/api/users/profile/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });


      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          await updateAppState(data.data, authToken, isInitialLoad);
          
          if (isInitialLoad) {
            setHasInitialLoadCompleted(true);
          }
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token validation failed: ${response.status}`);
      }
    } catch (error) {
      // Clear invalid token
      setToken(null);
      localStorage.removeItem('auth_token');
      setIsConnected(false);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Exchange authorization code for token
  const exchangeCodeForToken = async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token exchange failed');
      }

      const data = await response.json();
      
      if (data.success) {
        const { user: userData, token: jwtToken } = data.data;
        
        // ✅ Save token with 30-day persistent session  
        setToken(jwtToken);
        const { SessionManager } = await import('@/utils/sessionManager');
        SessionManager.saveAuthSession(jwtToken, userData, userData);
        
        // Update app state
        await updateAppState(userData, jwtToken, true);
        
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      setIsConnected(false);
      setToken(null);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  // Update app state with user data
  const updateAppState = async (userData: any, authToken: string, isInitialLoad: boolean) => {
    const existingUser = user;
    const shouldPreserveUserData = !isInitialLoad && existingUser && existingUser.googleId === userData.googleId;

    const processedUserData = {
      id: userData._id || userData.googleId,
      _id: userData._id || userData.googleId,
      googleId: userData.googleId,
      hashId: userData.googleId, // For compatibility
      email: userData.email || "",
      name: shouldPreserveUserData ? existingUser.name : (userData.displayName || userData.name || "User"),
      displayName: shouldPreserveUserData ? existingUser.displayName : (userData.displayName || userData.name || "User"),
      username: shouldPreserveUserData ? existingUser.username : (userData.username || ""),
      authProvider: 'google',
      bio: shouldPreserveUserData ? existingUser.bio : (userData.bio || ""),
      followerCount: userData.followerCount || 0,
      followingCount: userData.followingCount || 0,
      postCount: userData.postCount || 0,
    };

    const existingProfile = profile;
    const shouldPreserveProfileData = !isInitialLoad && existingProfile && existingProfile.googleId === userData.googleId;

    const profileData = {
      id: processedUserData.id,
      _id: processedUserData._id,
      googleId: processedUserData.googleId,
      hashId: processedUserData.googleId,
      name: shouldPreserveProfileData ? existingProfile.name : processedUserData.name,
      displayName: shouldPreserveProfileData ? existingProfile.displayName : processedUserData.displayName,
      username: shouldPreserveProfileData ? existingProfile.username : (processedUserData.username || processedUserData.email.split('@')[0]),
      email: processedUserData.email,
      handle: shouldPreserveProfileData ? existingProfile.handle : `@${processedUserData.username || processedUserData.email.split('@')[0]}`,
      avatar: shouldPreserveProfileData && existingProfile.avatar ? existingProfile.avatar : userData.avatar,
      bio: shouldPreserveProfileData ? existingProfile.bio : processedUserData.bio,
      followerCount: processedUserData.followerCount,
      followingCount: processedUserData.followingCount,
      postCount: processedUserData.postCount,
    };

    // Update app store
    setUser(processedUserData);
    setProfile(profileData);
    setIsConnected(true);
  };

  // Login function
  const login = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Use simple popup login
      const popup = window.open(
        `https://accounts.google.com/oauth/authorize?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token&scope=email profile`,
        'google-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup message
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          handleCredentialResponse({ credential: event.data.token });
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);
    } catch (error) {
      setIsConnected(false);
      setToken(null);
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // ✅ Clear persistent session
      const { SessionManager } = await import('@/utils/sessionManager');
      SessionManager.clearAuthSession();
      
      // Clear local state
      setToken(null);
      setIsConnected(false);
      setUser(null);
      setProfile(null);
      setHasInitialLoadCompleted(false);

      // Sign out from Google
      if (window.google) {
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
        }
      }

    } catch (error) {
    } finally {
      setIsLoading(false);
      window.location.reload();
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      await loadUserFromToken(token, false);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Get auth headers
  const getAuthHeaders = () => {
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } : {};
  };

  return {
    isLoading,
    login,
    logout,
    isConnected,
    getAuthHeaders,
    profile,
    refreshUserData,
    token,
  } as GoogleAuthContext;
};

// Declare global Google types
declare global {
  interface Window {
    google: any;
  }
}
