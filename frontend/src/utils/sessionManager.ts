// utils/sessionManager.ts - Simple Session Management for Google Auth
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export class SessionManager {
  // Save auth session with extended expiration
  static saveAuthSession(token: string, user: any, profile?: any): void {
    try {
      const sessionData = {
        token,
        user,
        profile: profile || user,
        expiresAt: Date.now() + SESSION_DURATION,
        savedAt: Date.now()
      };

      // Save to localStorage with extended duration
      localStorage.setItem('auth_session', JSON.stringify(sessionData));
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_hash_id', user?.hashId || '');
    } catch (error) {
      console.error('Failed to save auth session:', error);
    }
  }

  // Get saved session if still valid
  static getAuthSession(): { token: string; user: any; profile: any } | null {
    try {
      const sessionData = localStorage.getItem('auth_session');
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session expired
      if (now > session.expiresAt) {
        this.clearAuthSession();
        return null;
      }
      
      // Auto-extend session when accessed
      session.expiresAt = now + SESSION_DURATION;
      localStorage.setItem('auth_session', JSON.stringify(session));

      return {
        token: session.token,
        user: session.user,
        profile: session.profile
      };
    } catch (error) {
      console.error('Failed to get auth session:', error);
      this.clearAuthSession();
      return null;
    }
  }

  // Clear all session data
  static clearAuthSession(): void {
    try {
      // Clear extended session
      localStorage.removeItem('auth_session');
      
      // Clear all possible auth tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_hash_id');
      localStorage.removeItem('hashId');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Clear session storage
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear auth session:', error);
    }
  }

  // Check if user should stay logged in
  static shouldAutoLogin(): boolean {
    const session = this.getAuthSession();
    return session !== null;
  }

  // Get session info for debugging
  static getSessionInfo(): any {
    try {
      const sessionData = localStorage.getItem('auth_session');
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      const now = Date.now();
      const daysLeft = Math.round((session.expiresAt - now) / (24 * 60 * 60 * 1000));

      return {
        user: session.user?.username || session.user?.email,
        daysLeft,
        isValid: now < session.expiresAt,
        savedAt: new Date(session.savedAt).toLocaleString()
      };
    } catch (error) {
      return null;
    }
  }
}

// Initialize session extension on user activity
export const initializeSessionExtension = (): void => {
  let lastExtension = 0;
  
  const extendSession = () => {
    const now = Date.now();
    // Only extend once per hour to avoid spam
    if (now - lastExtension > 60 * 60 * 1000) {
      const session = SessionManager.getAuthSession();
      if (session) {
        // getAuthSession already extends the session
        lastExtension = now;
      }
    }
  };

  // Listen for user activity
  const events = ['click', 'scroll', 'keypress', 'mousemove'];
  events.forEach(event => {
    document.addEventListener(event, extendSession, { passive: true });
  });

  // Extend session every 30 minutes if user is active
  setInterval(() => {
    if (!document.hidden) {
      extendSession();
    }
  }, 30 * 60 * 1000);

  // Session extension initialized
};
