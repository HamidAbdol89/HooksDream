import { useState, useCallback } from 'react';

interface LoginLoadingState {
  isVisible: boolean;
  message: string;
}

export const useLoginLoading = () => {
  const [loadingState, setLoadingState] = useState<LoginLoadingState>({
    isVisible: false,
    message: 'Loading...'
  });

  const showLoading = useCallback((message: string = 'Loading...') => {
    setLoadingState({
      isVisible: true,
      message
    });
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState({
      isVisible: false,
      message: 'Loading...'
    });
  }, []);

  const showProgressiveLogin = useCallback(() => {
    showLoading('Signing you in...');
    
    // Progressive messages
    setTimeout(() => {
      updateMessage('Login successful!');
    }, 800);
    
    setTimeout(() => {
      updateMessage('Setting up your profile...');
    }, 1100);
    
    setTimeout(() => {
      updateMessage('Welcome to HooksDream!');
    }, 1400);
  }, [showLoading, updateMessage]);

  return {
    ...loadingState,
    showLoading,
    updateMessage,
    hideLoading,
    showProgressiveLogin
  };
};
