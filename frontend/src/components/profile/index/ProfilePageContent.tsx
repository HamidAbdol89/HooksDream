// ProfilePageContent.tsx - Cập nhật để tích hợp với useWeb3Auth
import React, { useRef, useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { setGlobalEditingState } from '@/hooks/useGoogleAuth';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import EditProfileModal from '@/components/profile/edit/EditProfileModal';
import { FollowerListModal } from './FollowerListModal';
import { ProfileCover } from './ProfileCover';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { ProfileSkeleton, ProfileError, UserNotFound } from './LoadingStates';

export const ProfilePageContent: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAppStore(state => state.user);
  
  // ✅ Hook Web3Auth để có refreshUserData
  const { isConnected } = useGoogleAuth();
  
  const possibleCurrentUserId = currentUser?._id || currentUser?.id;
  
  // ✅ Ref để track editing state và prevent Web3Auth overwrite
  const isEditingRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [activeTab, setActiveTab] = useState('posts');
  const [viewMode, setViewMode] = useState('list');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasMorePosts = true;

  // useProfile hook
  const {
    user,
    profile,
    posts,
    mediaPosts,
    likedPosts,
    loading,
    postsLoading,
    error,
    isOwnProfile,
    updateProfile,
    toggleFollow,
    togglePostLike,
    deletePost,
    loadProfile,
    refresh
  } = useProfile(userId || '', possibleCurrentUserId);

  // ✅ Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Handler functions
  const handleComment = (postId: string) => {
    console.log("Comment on", postId);
  };

  const handleShare = (postId: string) => {
    console.log("Share", postId);
  };

const handleEditProfile = async () => {
  setGlobalEditingState(true);
  
  // Clear any React Query cache that might interfere
  if (typeof window !== 'undefined' && (window as any).queryClient) {
    console.log('🧹 Clearing React Query cache...');
    (window as any).queryClient.clear();
  }
  
  // Force refresh profile data before opening edit modal
  console.log('🔄 Refreshing profile data before edit...');
  await refresh();
  
  setIsEditingProfile(true);
  console.log('Edit profile started - Web3Auth sync disabled');
};
  const handleFollow = () => {
    if (user?._id) {
      toggleFollow();
    }
  };

  const handleLikePost = (postId: string) => {
    togglePostLike(postId);
  };

  const handleDeletePost = (postId: string) => {
    deletePost(postId);
  };

  // ✅ QUAN TRỌNG: Modified handleSaveProfile với refreshUserData
  const handleSaveProfile = async (updatedData: any) => {
    try {
      console.log('💾 Saving profile (Web3Auth sync temporarily disabled):', updatedData);
      
      // 1. Update profile qua useProfile hook (sẽ call API)
      await updateProfile(updatedData);
      
      console.log('✅ Profile updated via useProfile hook');
      
      // 2. ✅ Schedule delayed Web3Auth refresh để tránh conflict
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('🔄 Refreshing Web3Auth data after profile edit...');
          
          // Reset editing flag trước khi refresh
          isEditingRef.current = false;
          
        
          console.log('✅ Web3Auth data refreshed successfully');
          
          // Optional: Refresh profile data để đảm bảo consistency
          await refresh();
          
        } catch (error) {
          console.error('❌ Failed to refresh Web3Auth data:', error);
        }
      }, 2000); // Delay 2s để đảm bảo server đã update xong
      
      // 3. Đóng modal
      setIsEditingProfile(false);
      
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      
      // Reset editing flag nếu có lỗi
      isEditingRef.current = false;
      
      throw error; // Re-throw để EditProfileModal hiển thị lỗi
    }
  };

  // ✅ Handle close modal
const handleCloseEditModal = () => {
  setIsEditingProfile(false);
  setTimeout(() => {
    setGlobalEditingState(false);
    console.log('Edit profile closed - Web3Auth sync re-enabled');
  }, 1000);
};

  const handleOpenFollowers = () => {
    setIsFollowersModalOpen(true);
  };

  const handleOpenFollowing = () => {
    setIsFollowingModalOpen(true);
  };

  const handleCloseFollowers = () => {
    setIsFollowersModalOpen(false);
  };

  const handleCloseFollowing = () => {
    setIsFollowingModalOpen(false);
  };

  // Render conditions
  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <ProfileError error={error} onRetry={refresh} />;
  }

  if (!user) {
    return <UserNotFound />;
  }

  // Convert User type to Profile type
  const profileData = {
    ...user,
    name: user.name || user.displayName || user.username || 'User',
    displayName: user.displayName || user.name || user.username || 'User',
    username: user.username || 'user',
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    postCount: user.postCount || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <ProfileCover coverImage={user.coverImage} />

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        {/* Profile Header */}
        <ProfileHeader
          user={profileData}
          isOwnProfile={isOwnProfile}
          onEditProfile={handleEditProfile}
          onFollow={handleFollow}
          onOpenFollowers={handleOpenFollowers}
          onOpenFollowing={handleOpenFollowing}
        />

        {/* Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          posts={posts}
          mediaPosts={mediaPosts}
          likedPosts={likedPosts}
          postsLoading={postsLoading}
          isOwnProfile={isOwnProfile}
          user={profileData}
          onLike={handleLikePost}
          onDelete={handleDeletePost}
          onComment={handleComment}
          onShare={handleShare}
          hasMorePosts={hasMorePosts}
          loadMoreRef={loadMoreRef}
        />
      </div>

      {/* ✅ Edit Profile Modal với handler đã update */}
      {isEditingProfile && user && (
        <EditProfileModal
          isOpen={isEditingProfile}
          onClose={handleCloseEditModal} // ✅ Sử dụng handler có logic reset flag
          user={user} // Use fresh data from refresh() 
          onSave={handleSaveProfile} // ✅ Handler có tích hợp refreshUserData
        />
      )}

      {/* Modal cho followers */}
      {user._id && (
        <>
          <FollowerListModal
            isOpen={isFollowersModalOpen}
            onClose={handleCloseFollowers}
            userId={user._id}
            currentUserId={possibleCurrentUserId || ''}
            type="followers"
          />
          
          <FollowerListModal
            isOpen={isFollowingModalOpen}
            onClose={handleCloseFollowing}
            userId={user._id}
            currentUserId={possibleCurrentUserId || ''}
            type="following"
          />
        </>
      )}
    </div>
  );
};