// AuthDebugPanel.tsx - Debug authentication state
import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export const AuthDebugPanel: React.FC = () => {
  const { isConnected, user, profile } = useAppStore();

  const checkTokens = () => {
    const tokens = {
      'auth_token': localStorage.getItem('auth_token'),
      'user_hash_id': localStorage.getItem('user_hash_id'),
      'hashId': localStorage.getItem('hashId'),
    };

    console.log('🔐 Token Debug:', tokens);
    
    // Try to decode JWT if available
    const jwtToken = localStorage.getItem('auth_token');
    if (jwtToken) {
      try {
        const parts = jwtToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('🎫 JWT Payload:', payload);
        }
      } catch (error) {
        console.error('❌ Failed to decode JWT:', error);
      }
    }

    return tokens;
  };

  const testCreatePostAuth = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      alert('❌ No auth_token found!');
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🧪 Test API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        alert('✅ Authentication working! You can create posts.');
      } else {
        const errorText = await response.text().catch(() => '');
        alert(`❌ Auth failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      alert(`❌ Test failed: ${error}`);
    }
  };

  const tokens = checkTokens();

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">🔐 Auth Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Connected:</strong> {isConnected ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>User:</strong> {user?.username || 'None'}
        </div>
        
        <div>
          <strong>auth_token:</strong> {tokens.auth_token ? '✅' : '❌'}
        </div>
        
        <div>
          <strong>user_hash_id:</strong> {tokens.user_hash_id ? '✅' : '❌'}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={checkTokens}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Check Tokens
        </button>
        
        <button
          onClick={testCreatePostAuth}
          className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Test Create Post Auth
        </button>
      </div>
    </div>
  );
};
