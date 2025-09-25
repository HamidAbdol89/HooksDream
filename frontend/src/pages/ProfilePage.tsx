// src/pages/ProfilePage.tsx
import React from 'react';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ProfilePageContent } from '@/components/profile/index/ProfilePageContent';

const ProfilePage: React.FC = () => {
  return (
    <ProfileProvider>
      <ProfilePageContent />
    </ProfileProvider>
  );
};

export default ProfilePage;