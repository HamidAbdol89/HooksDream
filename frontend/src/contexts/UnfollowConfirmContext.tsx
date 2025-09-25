// src/contexts/UnfollowConfirmContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { UnfollowConfirmDialog } from '@/components/dialogs/UnfollowConfirmDialog';

interface UnfollowConfirmContextType {
  showUnfollowConfirm: (username: string, onConfirm: () => void) => void;
}

const UnfollowConfirmContext = createContext<UnfollowConfirmContextType | undefined>(undefined);

export const useUnfollowConfirm = () => {
  const context = useContext(UnfollowConfirmContext);
  if (context === undefined) {
    throw new Error('useUnfollowConfirm must be used within an UnfollowConfirmProvider');
  }
  return context;
};

interface UnfollowConfirmState {
  isOpen: boolean;
  username: string;
  onConfirm: (() => void) | null;
  isLoading: boolean;
}

export const UnfollowConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UnfollowConfirmState>({
    isOpen: false,
    username: '',
    onConfirm: null,
    isLoading: false
  });

  const showUnfollowConfirm = useCallback((username: string, onConfirm: () => void) => {
    setState({
      isOpen: true,
      username,
      onConfirm,
      isLoading: false
    });
  }, []);

  const handleClose = useCallback(() => {
    if (!state.isLoading) {
      setState(prev => ({ ...prev, isOpen: false }));
    }
  }, [state.isLoading]);

  const handleConfirm = useCallback(async () => {
    if (state.onConfirm) {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        await state.onConfirm();
        setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
      } catch (error) {
        console.error('Error during unfollow:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  }, [state.onConfirm]);

  return (
    <UnfollowConfirmContext.Provider value={{ showUnfollowConfirm }}>
      {children}
      <UnfollowConfirmDialog
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        username={state.username}
        isLoading={state.isLoading}
      />
    </UnfollowConfirmContext.Provider>
  );
};