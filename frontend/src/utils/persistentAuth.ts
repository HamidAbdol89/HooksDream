// utils/persistentAuth.ts - Persistent Authentication System
interface AuthSession {
  token: string;
  user: any;
  profile: any;
  expiresAt: number;
  refreshToken?: string;
  lastActivity: number;
}

class PersistentAuthManager {
  private static instance: PersistentAuthManager;
  private readonly SESSION_KEY = 'hooksdream_auth_session';
  private readonly ACTIVITY_KEY = 'hooksdream_last_activity';
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly ACTIVITY_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days inactive = logout

  public static getInstance(): PersistentAuthManager {
    if (!PersistentAuthManager.instance) {
      PersistentAuthManager.instance = new PersistentAuthManager();
    }
    return PersistentAuthManager.instance;
  }

  // Save complete auth session
  public saveSession(token: string, user: any, profile: any, refreshToken?: string): void {
    const now = Date.now();
    const session: AuthSession = {
      token,
      user,
      profile,
      expiresAt: now + this.SESSION_DURATION,
      refreshToken,
      lastActivity: now
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(this.ACTIVITY_KEY, now.toString());
      
      // Also save individual items for backward compatibility
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_hash_id', user?.hashId || '');
      
      console.log('✅ Session saved successfully:', {
        user: user?.username,
        expiresIn: Math.round((session.expiresAt - now) / (24 * 60 * 60 * 1000)) + ' days'
      });
    } catch (error) {
      console.error('❌ Failed to save session:', error);
    }
  }

  // Get saved session if valid
  public getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: AuthSession = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session expired
      if (now > session.expiresAt) {
        console.log('⏰ Session expired, clearing...');
        this.clearSession();
        return null;
      }

      // Check if user was inactive too long
      const lastActivity = parseInt(localStorage.getItem(this.ACTIVITY_KEY) || '0');
      if (now - lastActivity > this.ACTIVITY_TIMEOUT) {
        console.log('😴 User inactive too long, clearing session...');
        this.clearSession();
        return null;
      }

      // Update last activity
      this.updateActivity();
      
      console.log('✅ Valid session found:', {
        user: session.user?.username,
        timeLeft: Math.round((session.expiresAt - now) / (24 * 60 * 60 * 1000)) + ' days'
      });

      return session;
    } catch (error) {
      console.error('❌ Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  // Update user activity timestamp
  public updateActivity(): void {
    const now = Date.now();
    localStorage.setItem(this.ACTIVITY_KEY, now.toString());
    
    // Also update session's lastActivity
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session: AuthSession = JSON.parse(sessionData);
        session.lastActivity = now;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  // Extend session expiration
  public extendSession(): void {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session: AuthSession = JSON.parse(sessionData);
        const now = Date.now();
        
        session.expiresAt = now + this.SESSION_DURATION;
        session.lastActivity = now;
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(this.ACTIVITY_KEY, now.toString());
        
        console.log('🔄 Session extended for 30 more days');
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }

  // Clear all session data
  public clearSession(): void {
    try {
      // Clear new session system
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.ACTIVITY_KEY);
      
      // Clear legacy tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_hash_id');
      localStorage.removeItem('hashId');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Clear session storage as well
      sessionStorage.removeItem('user_hash_id');
      sessionStorage.removeItem('hashId');
      sessionStorage.removeItem('token');
      
      console.log('🧹 All session data cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Check if user should stay logged in
  public shouldAutoLogin(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  // Get current token
  public getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  // Get current user
  public getUser(): any | null {
    const session = this.getSession();
    return session?.user || null;
  }

  // Get current profile
  public getProfile(): any | null {
    const session = this.getSession();
    return session?.profile || null;
  }

  // Update session data (for profile updates, etc.)
  public updateSession(updates: Partial<Pick<AuthSession, 'user' | 'profile'>>): void {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session: AuthSession = JSON.parse(sessionData);
        
        if (updates.user) session.user = { ...session.user, ...updates.user };
        if (updates.profile) session.profile = { ...session.profile, ...updates.profile };
        
        session.lastActivity = Date.now();
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        // Update backward compatibility items
        if (updates.user?.hashId) {
          localStorage.setItem('user_hash_id', updates.user.hashId);
        }
        
        console.log('🔄 Session updated');
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  // Initialize activity tracking
  public initializeActivityTracking(): void {
    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let lastUpdate = 0;
    
    const updateActivity = () => {
      const now = Date.now();
      // Throttle updates to every 5 minutes
      if (now - lastUpdate > 5 * 60 * 1000) {
        this.updateActivity();
        lastUpdate = now;
      }
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Update activity every 10 minutes while tab is active
    setInterval(() => {
      if (!document.hidden) {
        this.updateActivity();
      }
    }, 10 * 60 * 1000);

    console.log('👀 Activity tracking initialized');
  }

  // Get session info for debugging
  public getSessionInfo(): any {
    const session = this.getSession();
    if (!session) return null;

    const now = Date.now();
    return {
      user: session.user?.username,
      expiresIn: Math.round((session.expiresAt - now) / (24 * 60 * 60 * 1000)),
      lastActivity: new Date(session.lastActivity).toLocaleString(),
      isValid: now < session.expiresAt
    };
  }
}

// Export singleton instance
export const persistentAuth = PersistentAuthManager.getInstance();
