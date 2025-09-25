// hooks/useProfileState.ts
import { useState } from 'react';

export const useProfileState = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState('list');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    isEditingProfile,
    setIsEditingProfile,
    showFullBio,
    setShowFullBio,
    selectedImage,
    setSelectedImage,
  };
};