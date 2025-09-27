// ModernGoogleLogin.tsx - Modern Google Login Component
// Optimized for mobile-first UX, accessibility, and performance

import React, { useEffect, useRef, useState } from 'react';
import { useModernGoogleAuth, AuthState, AuthErrorType } from '@/hooks/useModernGoogleAuth';
import { useGoogleAuthFallback } from '@/hooks/useGoogleAuthFallback';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertCircle, RefreshCw, CheckCircle2, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernGoogleLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const ModernGoogleLogin: React.FC<ModernGoogleLoginProps> = ({
  onSuccess,
  onError,
  className = "",
  disabled = false,
  variant = 'default',
  size = 'md',
  showProgress = true
}) => {
  const { 
    authState, 
    isLoading, 
    isConnected, 
    error, 
    progress, 
    login, 
    retry, 
    clearError 
  } = useModernGoogleAuth();
  
  const fallbackAuth = useGoogleAuthFallback();
  
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showOneTap, setShowOneTap] = useState(false);

  // Handle success/error callbacks
  useEffect(() => {
    if (authState === AuthState.SUCCESS && onSuccess) {
      onSuccess();
    }
  }, [authState, onSuccess]);

  useEffect(() => {
    if (error && onError) {
      onError(error.message);
    }
  }, [error, onError]);

  // Render Google Sign-In button when ready
  useEffect(() => {
    if (authState === AuthState.IDLE && window.google?.accounts?.id && buttonRef.current && !isConnected) {
      try {
        // Clear any existing button
        buttonRef.current.innerHTML = '';
        
        // Set ID for the button element
        buttonRef.current.id = 'google-signin-button';
        
        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: variant === 'outline' ? 'outline' : 'filled_blue',
            size: size === 'lg' ? 'large' : size === 'sm' ? 'small' : 'medium',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: buttonRef.current.offsetWidth || 320
          }
        );
        setShowOneTap(true);
      } catch (error) {
        console.error('Error rendering Google button:', error);
        // If Google button fails, show fallback
        setShowOneTap(false);
      }
    }
  }, [authState, isConnected, variant, size]);

  // Size classes
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-900 border border-gray-300',
    minimal: 'bg-transparent hover:bg-gray-100 text-gray-700 border-0'
  };

  // Handle manual login trigger with fallback
  const handleLogin = async () => {
    try {
      clearError();
      
      // Try modern auth first
      if (window.google?.accounts?.id) {
        await login();
      } else {
        // Fallback to redirect-based auth
        console.log('Using fallback redirect authentication');
        fallbackAuth.loginWithRedirect();
      }
    } catch (error) {
      console.error('Login failed, trying fallback:', error);
      // If modern auth fails, try fallback
      fallbackAuth.loginWithRedirect();
    }
  };

  // Handle retry
  const handleRetry = async () => {
    try {
      await retry();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  // Don't show if already connected
  if (isConnected) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("w-full space-y-3", className)}>
        <Button
          disabled
          className={cn(
            "w-full relative overflow-hidden",
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{progress.message}</span>
          </div>
        </Button>
        
        {showProgress && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("w-full space-y-3", className)}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">
                Authentication Error
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error.message}
              </p>
              
              {/* Error-specific help text */}
              {error.type === AuthErrorType.SCRIPT_LOAD_FAILED && (
                <p className="text-xs text-red-600 mt-2">
                  Please check your internet connection and try again.
                </p>
              )}
              
              {error.type === AuthErrorType.USER_CANCELLED && (
                <p className="text-xs text-red-600 mt-2">
                  Sign-in was cancelled. Click retry to try again.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 mt-3">
            {error.canRetry && (
              <Button
                onClick={handleRetry}
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            
            <Button
              onClick={clearError}
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state (brief)
  if (authState === AuthState.SUCCESS) {
    return (
      <div className={cn("w-full", className)}>
        <Button
          disabled
          className={cn(
            "w-full bg-green-500 hover:bg-green-500 text-white border-green-500",
            sizeClasses[size]
          )}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Signed in successfully!
        </Button>
      </div>
    );
  }

  // Main render - Google button or fallback
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Google's Official Button Container */}
      <div 
        ref={buttonRef} 
        id="google-signin-button"
        className="w-full flex justify-center"
        style={{ minHeight: sizeClasses[size].includes('h-9') ? '36px' : 
                          sizeClasses[size].includes('h-11') ? '44px' : '48px' }}
      />
      
      {/* Fallback Custom Button - Always show as backup */}
      {!showOneTap && (
        <Button
          onClick={handleLogin}
          disabled={disabled || isLoading}
          className={cn(
            "w-full relative group transition-all duration-200",
            sizeClasses[size],
            variantClasses[variant],
            isHovered && "scale-[1.02]"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-center space-x-3">
            {/* Google Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
            
            <span className="font-medium">Continue with Google</span>
            
            {/* External link indicator for redirect */}
            {!window.google?.accounts?.id && (
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
            )}
            
            {/* Security indicator */}
            {window.google?.accounts?.id && (
              <Shield className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
            )}
          </div>
          
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md" />
        </Button>
      )}
      
      {/* Security note */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>Secure authentication with Google</span>
      </div>
    </div>
  );
};

export default ModernGoogleLogin;
