// src/types/user.ts
import { Profile, User } from '@/store/useAppStore';

// ✅ Sử dụng lại các type từ useAppStore để đảm bảo tính nhất quán
export type UserProfile = Profile;

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (updatedData: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
}

export type ProfileFormData = Partial<UserProfile>;
export type FormErrors = Record<string, string>;
export type ActiveTab = 'basic' | 'images' | 'social' | 'account';

// ✅ Helper functions để đảm bảo tính tương thích
export const isCloudinaryUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// ✅ Convert từ User sang UserProfile (tương thích với useAppStore)
export const convertUserToProfile = (userData: User): UserProfile => {
  return {
    id: userData.id,
    _id: userData._id,
    name: userData.name || userData.displayName || userData.username || 'User',
    avatar: userData.avatar,
    handle: userData.handle,
    email: userData.email,
    bio: userData.bio,
    displayName: userData.displayName,
    username: userData.username,
    coverImage: userData.coverImage,
    location: userData.location,
    website: userData.website,
    phone: userData.phone,
    pronouns: userData.pronouns,
    followerCount: userData.followerCount || 0,
    followingCount: userData.followingCount || 0,
    postCount: userData.postCount || 0,
    isSetupComplete: userData.isSetupComplete,
  };
};

// ✅ Merge user data với ưu tiên Cloudinary (tương thích với useAppStore)
export const mergeUserWithCloudinaryPriority = (userData: any): User => {
  const cloudinaryAvatar = userData?.avatar && isCloudinaryUrl(userData.avatar) 
    ? userData.avatar 
    : userData?.profileImage && isCloudinaryUrl(userData.profileImage)
    ? userData.profileImage
    : undefined;
  
  return {
    id: userData.id || userData._id || '',
    _id: userData._id || userData.id,
    googleId: userData.googleId,
    email: userData.email,
    name: userData.name || userData.displayName || userData.username,
    avatar: cloudinaryAvatar,
    handle: userData.handle,
    displayName: userData.displayName || userData.name,
    username: userData.username,
    coverImage: userData.coverImage,
    bio: userData.bio,
    location: userData.location,
    website: userData.website,
    phone: userData.phone,
    pronouns: userData.pronouns,
    followerCount: userData.followerCount,
    followingCount: userData.followingCount,
    postCount: userData.postCount,
    isSetupComplete: userData.isSetupComplete,
  };
};

// ✅ Type guards để kiểm tra
export const isUserProfile = (obj: any): obj is UserProfile => {
  return obj && (obj.id !== undefined || obj._id !== undefined);
};

export const isUser = (obj: any): obj is User => {
  return obj && (obj.id !== undefined || obj._id !== undefined);
};