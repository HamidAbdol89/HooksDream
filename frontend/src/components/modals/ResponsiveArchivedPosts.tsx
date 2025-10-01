// src/components/modals/ResponsiveArchivedPosts.tsx
import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ArchivedPostsModal } from './ArchivedPostsModal';
import { MobileArchivedPostsOverlay } from './MobileArchivedPostsOverlay';

interface ResponsiveArchivedPostsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsiveArchivedPosts: React.FC<ResponsiveArchivedPostsProps> = ({
  isOpen,
  onClose
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileArchivedPostsOverlay
        isOpen={isOpen}
        onClose={onClose}
      />
    );
  }

  return (
    <ArchivedPostsModal
      isOpen={isOpen}
      onClose={onClose}
    />
  );
};
