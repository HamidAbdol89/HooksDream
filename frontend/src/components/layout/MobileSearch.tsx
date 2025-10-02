// src/components/layout/MobileSearch.tsx
import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
// MobileSearchPage removed - using navigation to /search instead

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const MobileSearch = ({ isOpen, onClose }: MobileSearchProps) => {
  const navigate = useNavigate();

  // Navigate to dedicated mobile search page instead of modal
  const handleOpen = () => {
    navigate('/search');
    onClose();
  };

  // This component now just triggers navigation to /search
  // The actual search UI is handled by SearchPage
  React.useEffect(() => {
    if (isOpen) {
      handleOpen();
    }
  }, [isOpen]);

  return null; // No modal needed, just navigation
};