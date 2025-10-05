// src/components/feed/types.ts
import { UserProfile } from '@/hooks/useSocial';

// ĐẢM BẢO CẤU TRÚC KHỚP VỚI @/types/post
export interface Post {
  _id: string;
  userId: {
    _id: string; // ĐẢM BẢO LÀ string, KHÔNG PHẢI string | undefined
    username: string;
    displayName: string;
    avatar: string;
    isFollowing?: boolean;
    isVerified?: boolean;
    // THÊM CÁC FIELD KHÁC NẾU CẦN ĐỂ KHỚP VỚI @/types/post
    bio?: string;
    location?: string;
    website?: string;
    coverImage?: string;
    email?: string;
    phone?: string;
    pronouns?: string;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    isOwnProfile?: boolean;
    isSetupComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
    lastLoginAt?: string;
    // Special badge for bot users
    specialBadge?: {
      type: string;
      icon: string;
      color: string;
      label: string;
    };
  };
  content: string;
  likeCount: number;
  commentCount: number;
  shareCount?: number; // THÊM NẾU CẦN
  isLiked?: boolean;
  createdAt: string;
  images?: string[];
  video?: string;
  visibility?: string; // THÊM NẾU CẦN
}

export interface FeedProps {
  posts: Post[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  popularUsers: UserProfile[];
  isLoadingPopularUsers: boolean;
  currentUserProfile?: UserProfile;
  onRefresh: () => void;
  onLoadMore: () => void;
  onLike: (postId: string) => void;
  onFollow: (userId: string, currentStatus: boolean) => void;
  onCreatePost: () => void;
  isFollowLoading: boolean;
}

export interface MediaFallbackProps {
  mediaPath: string;
  alt: string;
  className: string;
  isVideo?: boolean;
}