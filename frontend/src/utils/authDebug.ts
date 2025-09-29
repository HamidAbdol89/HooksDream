// utils/authDebug.ts - Authentication Debug Utility
export const debugAuthTokens = () => {
  console.group('🔐 Authentication Debug');
  
  // Check all possible token locations
  const tokens = {
    'auth_token (JWT)': localStorage.getItem('auth_token'),
    'user_hash_id': localStorage.getItem('user_hash_id'),
    'hashId': localStorage.getItem('hashId'),
    'token': localStorage.getItem('token'),
    'userId': localStorage.getItem('userId'),
    'auth_session': localStorage.getItem('auth_session'),
  };
  
  console.table(tokens);
  
  // Try to decode JWT if available
  const jwtToken = localStorage.getItem('auth_token');
  if (jwtToken) {
    try {
      const parts = jwtToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('🎯 JWT Payload:', payload);
        
        const now = Date.now() / 1000;
        if (payload.exp && payload.exp < now) {
          console.error('❌ JWT Token is EXPIRED');
        } else {
          console.log('✅ JWT Token is valid');
        }
      } else {
        console.error('❌ Invalid JWT format');
      }
    } catch (error) {
      console.error('❌ Failed to decode JWT:', error);
    }
  } else {
    console.warn('⚠️ No JWT token found');
  }
  
  // Check session storage
  const sessionTokens = {
    'session auth_token': sessionStorage.getItem('auth_token'),
    'session user_hash_id': sessionStorage.getItem('user_hash_id'),
  };
  
  if (Object.values(sessionTokens).some(Boolean)) {
    console.log('📦 Session Storage:', sessionTokens);
  }
  
  console.groupEnd();
};

// Quick test function for API calls
export const testChatAuth = async () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const token = localStorage.getItem('auth_token') || localStorage.getItem('user_hash_id');
  
  if (!token) {
    console.error('❌ No token available for testing');
    return;
  }
  
  try {
    console.log('🧪 Testing chat API with token:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Chat API Success:', data);
    } else {
      const error = await response.text();
      console.error('❌ Chat API Error:', error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Export for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuthTokens;
  (window as any).testChatAuth = testChatAuth;
}
