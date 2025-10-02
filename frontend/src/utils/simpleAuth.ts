// Simple Auth Utils - Clear and straightforward authentication
import { SessionManager } from './sessionManager';

export const simpleAuth = {
  // Clear all authentication data
  clearAuth: () => {
    console.log('🧹 Clearing all auth data...');
    
    // Use SessionManager to clear properly
    SessionManager.clearAuthSession();
    
    // Clear additional cache data
    const additionalKeys = [
      'hooksdream_link_previews', // Clear cache too
      'user_data',
      'profile_data'
    ];
    
    additionalKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Removing ${key}:`, localStorage.getItem(key)?.substring(0, 50) + '...');
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    // Disable Google auto-select
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      console.log('Google auto-select disabled');
    }
    
    console.log('✅ All auth data cleared');
  },

  // Check what auth data exists
  checkAuthData: () => {
    console.log('🔍 Checking auth data...');
    
    const sessionInfo = SessionManager.getSessionInfo();
    const authData = {
      session_info: sessionInfo,
      auth_token: localStorage.getItem('auth_token'),
      user_hash_id: localStorage.getItem('user_hash_id'),
      auth_session: localStorage.getItem('auth_session') ? 'exists' : 'none',
      user_data: localStorage.getItem('user_data'),
      profile_data: localStorage.getItem('profile_data'),
      sessionStorage_keys: Object.keys(sessionStorage),
      cookies: document.cookie
    };
    
    console.table(authData);
    return authData;
  },

  // Simple logout
  logout: async () => {
    console.log('🚪 Starting simple logout...');
    
    // Check what we have before clearing
    simpleAuth.checkAuthData();
    
    // Clear everything
    simpleAuth.clearAuth();
    
    // Check what we have after clearing
    console.log('After clearing:');
    simpleAuth.checkAuthData();
    
    // Redirect to login page
    console.log('🔄 Redirecting to login...');
    window.location.href = '/';
  }
};

// Global access for debugging
(window as any).simpleAuth = simpleAuth;
