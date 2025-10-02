import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api';

// Enhanced User Interface for Mobile
export interface MobileUser {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverImage?: string;
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  bio?: string;
  location?: string;
  joinedAt?: string;
  isFollowing?: boolean;
  mutualFollowers?: number;
  lastActive?: string;
  interests?: string[];
  isOnline?: boolean;
  profileViews?: number;
  engagementRate?: number;
  recommendationReasons?: string[];
  recommendationScore?: number;
  daysSinceJoined?: number;
  trendingReason?: string;
  approximateDistance?: number;
}

// Query Options Interface
interface UserQueryOptions {
  sortBy?: 'joinedAt' | 'followersCount' | 'engagementRate' | 'lastActive';
  order?: 'asc' | 'desc';
  location?: string;
  interests?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  isOnline?: boolean;
}

// Enhanced API functions
const usersAPI = {
  getPopularUsers: async (): Promise<MobileUser[]> => {
    const response = await userApi.getPopularUsers();
    if (response.success) {
      return response.data || [];
    }
    return [];
  },

  getAllUsers: async (limit: number = 50, options?: UserQueryOptions): Promise<MobileUser[]> => {
    // Use popular users API with higher limit for "all users"
    const response = await userApi.getPopularUsers();
    if (response.success) {
      let users = response.data || [];
      
      // Apply sorting if specified
      if (options?.sortBy) {
        users = users.sort((a: MobileUser, b: MobileUser) => {
          const aValue = (a[options.sortBy!] as number) || 0;
          const bValue = (b[options.sortBy!] as number) || 0;
          return options.order === 'desc' ? bValue - aValue : aValue - bValue;
        });
      }
      
      return users.slice(0, limit);
    }
    return [];
  },

  getRecommendedUsers: async (): Promise<MobileUser[]> => {
    const response = await userApi.getRecommendedUsers(10);
    if (response.success) {
      return response.data || [];
    }
    return [];
  },

  getNearbyUsers: async (radius: number = 50): Promise<MobileUser[]> => {
    // Try to get user's location
    let lat, lng;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (error) {
        console.log('Geolocation not available, using fallback');
      }
    }
    
    const response = await userApi.getNearbyUsers(radius, lat, lng, 15);
    if (response.success) {
      return response.data || [];
    }
    return [];
  },

  getNewUsers: async (limit: number = 20): Promise<MobileUser[]> => {
    const response = await userApi.getNewUsers(limit, 30);
    if (response.success) {
      return response.data || [];
    }
    return [];
  },

  getTrendingUsers: async (limit: number = 15): Promise<MobileUser[]> => {
    const response = await userApi.getTrendingUsers(limit, 7);
    if (response.success) {
      return response.data || [];
    }
    return [];
  }
};

// Popular users hook
export const usePopularUsers = () => {
  return useQuery({
    queryKey: ['popular-users'],
    queryFn: usersAPI.getPopularUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false
  });
};

// All users hook (for friend page)
export const useAllUsers = (limit: number = 50, options?: UserQueryOptions) => {
  return useQuery({
    queryKey: ['all-users', limit, options],
    queryFn: () => usersAPI.getAllUsers(limit, options),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
    refetchOnWindowFocus: false
  });
};

// Recommended users hook (ML-based recommendations)
export const useRecommendedUsers = () => {
  return useQuery({
    queryKey: ['recommended-users'],
    queryFn: usersAPI.getRecommendedUsers,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false
  });
};

// Nearby users hook (location-based)
export const useNearbyUsers = (radius: number = 50) => {
  return useQuery({
    queryKey: ['nearby-users', radius],
    queryFn: () => usersAPI.getNearbyUsers(radius),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!navigator.geolocation // Only run if geolocation is available
  });
};

// New users hook (recently joined)
export const useNewUsers = (limit: number = 20) => {
  return useQuery({
    queryKey: ['new-users', limit],
    queryFn: () => usersAPI.getNewUsers(limit),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1,
    refetchOnWindowFocus: false
  });
};

// Trending users hook (high engagement)
export const useTrendingUsers = (limit: number = 15) => {
  return useQuery({
    queryKey: ['trending-users', limit],
    queryFn: () => usersAPI.getTrendingUsers(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
    refetchOnWindowFocus: false
  });
};