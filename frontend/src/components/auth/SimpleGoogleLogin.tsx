import React, { useEffect, useRef } from 'react';

interface SimpleGoogleLoginProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

const SimpleGoogleLogin: React.FC<SimpleGoogleLoginProps> = ({ onSuccess, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Handle credential response
  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Google credential received:', response.credential ? 'Yes' : 'No');
      
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await backendResponse.json();
      console.log('Backend response:', data);

      if (data.success && data.data) {
        // Save token
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_hash_id', data.data.user.hashId);
        
        if (onSuccess) onSuccess(data);
        
        // Reload page to trigger app state update
        window.location.reload();
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (onError) onError(error);
    }
  };

  // Initialize Google Auth
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        console.log('Initializing Google Auth...');
        
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        // Render button
        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 320
          });
        }
      }
    };

    // Load Google script if not loaded
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, [GOOGLE_CLIENT_ID]);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};

export default SimpleGoogleLogin;
