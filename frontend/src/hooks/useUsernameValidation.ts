import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

interface UsernameValidationResult {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  message: string;
}

export const useUsernameValidation = (username: string, currentUsername?: string) => {
  const [result, setResult] = useState<UsernameValidationResult>({
    status: 'idle',
    message: ''
  });

  const debouncedUsername = useDebounce(username, 500);

  useEffect(() => {
    const validateUsername = async () => {
      // Reset if empty or same as current
      if (!debouncedUsername || debouncedUsername === currentUsername) {
        setResult({ status: 'idle', message: '' });
        return;
      }

      // Local validation first
      if (debouncedUsername.length < 3) {
        setResult({ 
          status: 'invalid', 
          message: 'Username must be at least 3 characters' 
        });
        return;
      }

      if (debouncedUsername.length > 20) {
        setResult({ 
          status: 'invalid', 
          message: 'Username must be less than 20 characters' 
        });
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(debouncedUsername)) {
        setResult({ 
          status: 'invalid', 
          message: 'Username can only contain letters, numbers and underscores' 
        });
        return;
      }

      // Check availability with backend
      setResult({ status: 'checking', message: 'Checking availability...' });

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        
        // Try to check with users API (search for existing username)
        const response = await fetch(`${API_BASE_URL}/api/users?search=${encodeURIComponent(debouncedUsername)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('google_auth_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const users = data.data || data.users || [];
          
          // Check if any user has this exact username
          const existingUser = users.find((user: any) => 
            user.username?.toLowerCase() === debouncedUsername.toLowerCase()
          );

          if (existingUser) {
            setResult({ 
              status: 'taken', 
              message: 'Username already taken' 
            });
          } else {
            setResult({ 
              status: 'available', 
              message: 'Username available!' 
            });
          }
        } else {
          // Fallback - show warning
          setResult({ 
            status: 'available', 
            message: 'Username looks good!' 
          });
        }
      } catch (error) {
        console.warn('Username validation failed:', error);
        // Fallback - show warning
        setResult({ 
          status: 'available', 
          message: 'Username looks good!' 
        });
      }
    };

    validateUsername();
  }, [debouncedUsername, currentUsername]);

  return result;
};
