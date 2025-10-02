import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api';

// Types
interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  bio?: string;
  isFollowing?: boolean;
}

// API functions
const usersAPI = {
  getPopularUsers: async (): Promise<User[]> => {
    const response = await userApi.getPopularUsers();
    if (response.success) {
      return response.data || [];
    }
    return [];
  },

  getAllUsers: async (limit: number = 50): Promise<User[]> => {
    // Use popular users API with higher limit for "all users"
    const response = await userApi.getPopularUsers();
    if (response.success) {
      return (response.data || []).slice(0, limit);
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
export const useAllUsers = (limit: number = 50) => {
  return useQuery({
    queryKey: ['all-users', limit],
    queryFn: () => usersAPI.getAllUsers(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
    refetchOnWindowFocus: false
  });
};