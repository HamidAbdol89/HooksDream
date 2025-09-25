// GoogleLogin.tsx - Google OAuth Login Component

import React, { useEffect, useRef } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface GoogleLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({
  onSuccess,
  onError,
  className = "",
  disabled = false
}) => {
  const { login, isLoading, isConnected } = useGoogleAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Render Google Sign-In button when component mounts
    if (window.google && buttonRef.current && !isConnected) {
      try {
        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320
          }
        );
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    }
  }, [isConnected]);

  const handleLogin = async () => {
    try {
      await login();
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      onError?.(errorMessage);
    }
  };

  if (isConnected) {
    return null; // Don't show login button if already connected
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Google's Official Button */}
      <div ref={buttonRef} className="w-full flex justify-center" />
      
      {/* Fallback Custom Button (if official button fails) */}
      {!window.google && (
        <Button
          onClick={handleLogin}
          disabled={disabled || isLoading}
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>
      )}
    </div>
  );
};

export default GoogleLogin;
