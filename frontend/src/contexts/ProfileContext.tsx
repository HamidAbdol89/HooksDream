// src/contexts/ProfileContext.tsx
import React, { createContext, useContext } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAppStore } from '@/store/useAppStore';
import { useParams } from 'react-router-dom';

const ProfileContext = createContext<any>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useParams<{ userId: string }>();
  const currentUserId = useAppStore(state => state.user?._id);
  
  const profileData = useProfile(userId || '', currentUserId);

  return (
    <ProfileContext.Provider value={profileData}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};