// src/store/useAppStore.ts
import { create } from "zustand";
import { api, userApi } from "@/services/api";

export type Profile = {
  id: string;
  _id: string;
  googleId?: string;
  name: string;
  avatar?: string;
  handle?: string;
  email?: string;
  bio?: string;
  displayName: string;
  username: string;
  coverImage?: string;
  location?: string;
  website?: string;
  phone?: string;
  pronouns?: string;
  followerCount: number; 
  followingCount: number; 
  postCount: number; 
  isFollowing?: boolean; 
  isSetupComplete?: boolean;
  hashId?: string;
  isNewUser?: boolean;
  isVerified?: boolean; 
  joinedDate?: string; 
  isOwnProfile?: boolean; 
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastLoginAt?: string | Date;
};

export type User = {
  id: string;
  _id: string;
  googleId: string;
  email?: string;
  name?: string;
  avatar?: string;
  handle?: string;
  displayName: string;
  username: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  pronouns?: string;
  followerCount: number; 
  followingCount: number; 
  postCount: number; 
  isFollowing?: boolean;
  isSetupComplete?: boolean;
  hashId?: string;
  isNewUser?: boolean;
  isVerified?: boolean; 
  joinedDate?: string; 

};

export interface Post {
  _id: string;
  userId: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  commentCount: number;
  shareCount?: number;
  repostCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  images?: string[];
  video?: string;
  comments?: Comment[];
  viewCount: number;
  // Repost fields
  repost_of?: {
    _id: string;
    userId: {
      _id: string;
      username: string;
      displayName: string;
      avatar: string;
      isVerified?: boolean;
    };
    content: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    shareCount?: number;
    repostCount?: number;
    images?: string[];
    video?: string;
    isDeleted?: boolean;
  };
}


export interface NewPostInput {
  content: string;
  images?: string[];
  video?: string;
}

export interface PostCardProps {
  post: Post;
  isOwnProfile?: boolean;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}


// HELPER ĐỂ KIỂM TRA CLOUDINARY URL
export const isCloudinaryUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
};

// HELPER ĐỂ LẤY AVATAR TỪ CLOUDINARY (ƯU TIÊN SỐ 1)
export const getCloudinaryAvatar = (userData: any): string | undefined => {
  // Ưu tiên 1: avatar từ Cloudinary
  if (userData?.avatar && isCloudinaryUrl(userData.avatar)) {
    return userData.avatar;
  }
  // Ưu tiên 2: profileImage nếu là Cloudinary
  if (userData?.profileImage && isCloudinaryUrl(userData.profileImage)) {
    return userData.profileImage;
  }
  // Không lấy avatar từ Google OAuth/Facebook/Lens
  return undefined;
};



export const convertUserToProfile = (userData: User): Profile => {
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
    isFollowing: userData.isFollowing, 
    isSetupComplete: userData.isSetupComplete,
    isVerified: userData.isVerified, 
    joinedDate: userData.joinedDate, 
  };
};

export const mergeUserWithCloudinaryPriority = (userData: any): User => {
  const cloudinaryAvatar = getCloudinaryAvatar(userData);
  
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
    followerCount: userData.followerCount || 0, 
    followingCount: userData.followingCount || 0, 
    postCount: userData.postCount || 0, 
    isFollowing: userData.isFollowing, 
    isSetupComplete: userData.isSetupComplete,
    isVerified: userData.isVerified,
    joinedDate: userData.joinedDate,
  };
};


// 🔥 NOTIFICATION SYSTEM
type ProfileUpdateListener = () => void;

// App state
export type AppState = {
  // Connection state
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // Profile
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  isLoadingProfile: boolean;
  setIsLoadingProfile: (loading: boolean) => void;
  refetchProfile: () => Promise<void>;

  // User data (SỬ DỤNG CHO TẤT CẢ COMPONENTS)
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (user: Partial<User>) => void;

  // 🔥 NOTIFICATION SYSTEM
  profileUpdateListeners: Set<ProfileUpdateListener>;
  addProfileUpdateListener: (listener: ProfileUpdateListener) => () => void;
  notifyProfileUpdate: () => void;

  // UI state
  showCreatePost: boolean;
  toggleCreatePost: () => void;

};

// Store
export const useAppStore = create<AppState>((set, get) => ({
  // Connection
  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),

  // Profile
  profile: null,
  setProfile: (profile) => {
    set({ profile });
    // 🔥 NOTIFY LISTENERS KHI PROFILE THAY ĐỔI
    const { notifyProfileUpdate } = get();
    notifyProfileUpdate();
  },
  updateProfile: (updates) => {
    set((state) => ({ 
      profile: state.profile ? { ...state.profile, ...updates } : null 
    }));
    // 🔥 NOTIFY LISTENERS KHI PROFILE UPDATE
    const { notifyProfileUpdate } = get();
    notifyProfileUpdate();
  },
  isLoadingProfile: false,
  setIsLoadingProfile: (loading) => set({ isLoadingProfile: loading }),
  
  // ✅ FIXED: REFETCH PROFILE - SỬ DỤNG CLOUDINARY PRIORITY
  refetchProfile: async () => {
    const state = get();
    const userId = state.user?._id || state.user?.id || state.profile?.id;
    
    if (!userId) {
      return;
    }

    try {
      set({ isLoadingProfile: true });
      
      const response = await userApi.getProfile(userId);
      
      if (response.success && response.data) {
        // ✅ SỬ DỤNG CLOUDINARY PRIORITY MERGE
        const userData = mergeUserWithCloudinaryPriority(response.data);
        // ✅ CONVERT USER -> PROFILE ĐỂ TRÁNH LỖI TYPE
        const profileData = convertUserToProfile(userData);
        
        set({ 
          user: userData,
          profile: profileData, // ✅ SỬ DỤNG PROFILE DATA ĐÃ CONVERT
          isLoadingProfile: false 
        });
        
        // 🔥 NOTIFY LISTENERS AFTER SUCCESSFUL REFETCH
        const { notifyProfileUpdate } = get();
        notifyProfileUpdate();
      } else {
        throw new Error(response.message || 'Failed to refetch profile');
      }
    } catch (error) {
      set({ isLoadingProfile: false });
      throw error;
    }
  },

  // User data (SỬ DỤNG CHO TẤT CẢ COMPONENTS)
  user: null,
  setUser: (user) => {
    set({ user });
    // 🔥 NOTIFY LISTENERS KHI USER THAY ĐỔI
    const { notifyProfileUpdate } = get();
    notifyProfileUpdate();
  },
  updateUser: (updates) => {
    set((state) => ({ 
      user: state.user ? { ...state.user, ...updates } : null 
    }));
    // 🔥 NOTIFY LISTENERS KHI USER UPDATE
    const { notifyProfileUpdate } = get();
    notifyProfileUpdate();
  },

  // 🔥 NOTIFICATION SYSTEM IMPLEMENTATION
  profileUpdateListeners: new Set(),
  
  addProfileUpdateListener: (listener: ProfileUpdateListener) => {
    const { profileUpdateListeners } = get();
    profileUpdateListeners.add(listener);
    
    // Return cleanup function
    return () => {
      const { profileUpdateListeners } = get();
      profileUpdateListeners.delete(listener);
    };
  },
  
  notifyProfileUpdate: () => {
    const { profileUpdateListeners } = get();
    
    // Notify all listeners
    profileUpdateListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
      }
    });
  },

  // UI
  showCreatePost: false,
  toggleCreatePost: () => set((state) => ({ showCreatePost: !state.showCreatePost })),

}));


