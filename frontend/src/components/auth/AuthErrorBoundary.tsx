// AuthErrorBoundary.tsx - Error Boundary for Authentication
// Comprehensive error handling and recovery mechanisms

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
}

class AuthErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Auth Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to error reporting service (if available)
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      return; // Max retries reached
    }

    this.setState({
      retryCount: retryCount + 1
    });

    // Exponential backoff
    const delay = Math.pow(2, retryCount) * 1000;
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, delay);
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getErrorMessage = (error: Error): string => {
    if (error.message.includes('Google')) {
      return 'Google Authentication service is currently unavailable. Please try again later.';
    }
    
    if (error.message.includes('Network')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('Script')) {
      return 'Failed to load authentication services. Please refresh the page.';
    }
    
    return 'An unexpected error occurred during authentication. Please try again.';
  };

  getRecoveryActions = (error: Error) => {
    const actions = [];
    
    // Always allow retry unless max attempts reached
    if (this.state.retryCount < 3) {
      actions.push({
        label: `Retry ${this.state.retryCount > 0 ? `(${this.state.retryCount}/3)` : ''}`,
        action: this.handleRetry,
        icon: RefreshCw,
        variant: 'default' as const
      });
    }
    
    // Reload for script/network errors
    if (error.message.includes('Script') || error.message.includes('Network')) {
      actions.push({
        label: 'Refresh Page',
        action: this.handleReload,
        icon: RefreshCw,
        variant: 'outline' as const
      });
    }
    
    // Always provide home navigation
    actions.push({
      label: 'Go Home',
      action: this.handleGoHome,
      icon: Home,
      variant: 'ghost' as const
    });
    
    return actions;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;
      const errorMessage = this.getErrorMessage(error);
      const recoveryActions = this.getRecoveryActions(error);

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-red-200 dark:border-red-800 overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 dark:bg-red-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    Authentication Error
                  </h1>
                  <p className="text-red-100 text-sm">
                    Something went wrong
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {errorMessage}
                </p>
                
                {this.state.retryCount > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Retry attempt {this.state.retryCount} of 3
                    </p>
                  </div>
                )}
              </div>

              {/* Recovery Actions */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  What you can do:
                </h3>
                
                <div className="grid gap-2">
                  {recoveryActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        onClick={action.action}
                        variant={action.variant}
                        className="justify-start"
                        disabled={action.label.includes('Retry') && this.state.retryCount >= 3}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Help Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Still having trouble?
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('mailto:support@hooksdream.com', '_blank')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Contact Support
                  </Button>
                </div>
              </div>

              {/* Technical Details (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                      {error.toString()}
                      {this.state.errorInfo && (
                        <>
                          {'\n\nComponent Stack:'}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;

// Hook for functional components to trigger error boundary
export const useAuthErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { throwError, clearError };
};

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    
    // Log to error reporting service
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `Unhandled Promise: ${event.reason}`,
        fatal: false
      });
    }
  });
}
