// hooks/useProfileActions.ts
import { useCallback } from 'react';
import { Profile } from "@/store/useAppStore";

interface UseProfileActionsProps {
  toggleFollow: () => Promise<void>;
  togglePostLike: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  loadProfile: () => void;
  setIsEditingProfile: (value: boolean) => void;
}

export const useProfileActions = ({
  toggleFollow,
  togglePostLike,
  deletePost,
  updateProfile,
  loadProfile,
  setIsEditingProfile,
}: UseProfileActionsProps) => {
  const handleFollow = useCallback(async () => {
    await toggleFollow();
  }, [toggleFollow]);

  const handleLikePost = useCallback(async (postId: string) => {
    await togglePostLike(postId);
  }, [togglePostLike]);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
    }
  }, [deletePost]);

  const handleSaveProfile = useCallback(async (updatedData: Partial<Profile>) => {
    try {
      await updateProfile(updatedData);
      setIsEditingProfile(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }, [updateProfile, setIsEditingProfile, loadProfile]);

  const handleEditProfile = useCallback(() => {
    setIsEditingProfile(true);
  }, [setIsEditingProfile]);

  return {
    handleFollow,
    handleLikePost,
    handleDeletePost,
    handleSaveProfile,
    handleEditProfile,
  };
};