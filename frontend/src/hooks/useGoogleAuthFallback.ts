// useGoogleAuthFallback.ts - Fallback Google Authentication
// Simple, reliable authentication without CORS/FedCM issues

import { useCallback, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const useGoogleAuthFallback = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setIsConnected, setProfile, setUser } = useAppStore();

  // Simple redirect-based authentication
  const loginWithRedirect = useCallback(() => {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'email profile';
    const responseType = 'code';
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state for validation
    localStorage.setItem('google_auth_state', state);
    
    const authUrl = new URL('https://accounts.google.com/oauth/authorize');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', responseType);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    window.location.href = authUrl.toString();
  }, []);

  // Handle callback from Google
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate state
      const storedState = localStorage.getItem('google_auth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      // Exchange code for token via backend
      const response = await fetch(`${API_BASE_URL}/api/auth/google/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Authentication failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const { user, profile, token } = data.data;
        
        // Save token
        localStorage.setItem('auth_token', token);
        localStorage.removeItem('google_auth_state');
        
        // Update app state
        setUser(user);
        setProfile(profile);
        setIsConnected(true);
        
        return true;
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
      
    } catch (error) {
      console.error('Callback handling failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setProfile, setIsConnected]);

  // Simple popup-based auth (as last resort)
  const loginWithPopup = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const redirectUri = `${window.location.origin}/auth/popup`;
      const scope = 'email profile';
      const responseType = 'code';
      const state = Math.random().toString(36).substring(2, 15);
      
      const authUrl = new URL('https://accounts.google.com/oauth/authorize');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', responseType);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('state', state);
      
      const popup = window.open(
        authUrl.toString(),
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      
      // Listen for popup completion
      return new Promise<boolean>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled'));
          }
        }, 1000);
        
        // Listen for message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', handleMessage);
            
            handleCallback(event.data.code, event.data.state)
              .then(resolve)
              .catch(reject);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener('message', handleMessage);
            reject(new Error(event.data.error));
          }
        };
        
        window.addEventListener('message', handleMessage);
      });
      
    } catch (error) {
      console.error('Popup auth failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleCallback]);

  return {
    isLoading,
    error,
    loginWithRedirect,
    loginWithPopup,
    handleCallback,
    clearError: () => setError(null)
  };
};
