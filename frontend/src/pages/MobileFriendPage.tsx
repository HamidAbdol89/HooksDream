// src/pages/MobileFriendPage.tsx - Mobile-First Friend Discovery
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Crown, TrendingUp, MessageSquare, 
  RefreshCw, Heart, MapPin, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FollowButton } from '@/components/ui/FollowButton';
import { useAllUsers, usePopularUsers, useNearbyUsers, useRecommendedUsers, useTrendingUsers, MobileUser } from '@/hooks/useUsersQuery';
import { useChat } from '@/hooks/useChat';
import SocialCard from '@/components/ui/SocialCard';
import api from '@/services/api';

// Remove duplicate interface - using MobileUser from useUsersQuery


const MobileFriendPage: React.FC = () => {
  const navigate = useNavigate();
  const { useDirectConversation } = useChat();
  
  // State Management - Simplified
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // React Query Hooks - Smart Data Fetching
  const { data: recommendedUsers = [], isLoading: isLoadingRecommended, refetch: refetchRecommended } = useRecommendedUsers();
  const { data: popularUsers = [], isLoading: isLoadingPopular, refetch: refetchPopular } = useTrendingUsers();
  const { data: nearbyUsers = [], isLoading: isLoadingNearby, refetch: refetchNearby } = useNearbyUsers();
  const { data: newUsers = [], isLoading: isLoadingNew, refetch: refetchNew } = useAllUsers(20, { sortBy: 'joinedAt', order: 'desc' });

  // Pull to Refresh - Refresh all data
  const handlePullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchRecommended(),
        refetchPopular(),
        refetchNearby(),
        refetchNew()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchRecommended, refetchPopular, refetchNearby, refetchNew]);

  // Handle Chat Navigation - Direct to individual chat
  const handleChatClick = async (userId: string) => {
    try {
      // Get or create direct conversation with the user
      const response = await api.chat.getOrCreateDirectConversation(userId);
      
      if (response.success && response.data) {
        // Navigate directly to the conversation (isInChat mode)
        navigate(`/messages/${response.data._id}`);
      } else {
        // Fallback to messages with user query
        navigate(`/messages?user=${userId}`);
      }
    } catch (error) {
      console.error('Failed to navigate to chat:', error);
      // Fallback navigation
      navigate(`/messages?user=${userId}`);
    }
  };

  // Handle Profile Navigation
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Freestyle Layout - All Sections */}
      <div className="px-4 py-4 space-y-8">
        
        {/* For You Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <h2 className="text-lg font-bold text-foreground">For You</h2>
          </div>
          <div className="space-y-3">
            {recommendedUsers.slice(0, 5).map((user: MobileUser, index: number) => (
              <SocialCard
                key={`recommended-${user._id}`}
                user={user}
                onProfileClick={handleProfileClick}
                onChatClick={handleChatClick}
                index={index}
                variant="default"
                showInterests={true}
                showStats={true}
                showLocation={true}
              >
                <FollowButton
                  userId={user._id}
                  initialIsFollowing={user.isFollowing || false}
                  className="flex-1"
                />
                <button
                  onClick={() => handleChatClick(user._id)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-accent active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
              </SocialCard>
            ))}
          </div>
        </div>

        {/* Trending Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-foreground">Trending</h2>
          </div>
          <div className="space-y-3">
            {popularUsers.slice(0, 5).map((user: MobileUser, index: number) => (
              <SocialCard
                key={`trending-${user._id}`}
                user={user}
                onProfileClick={handleProfileClick}
                onChatClick={handleChatClick}
                index={index}
                variant="default"
                showInterests={true}
                showStats={true}
                showLocation={true}
              >
                <FollowButton
                  userId={user._id}
                  initialIsFollowing={user.isFollowing || false}
                  className="flex-1"
                />
                <button
                  onClick={() => handleChatClick(user._id)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-accent active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
              </SocialCard>
            ))}
          </div>
        </div>

        {/* Nearby Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-foreground">Nearby</h2>
          </div>
          <div className="space-y-3">
            {nearbyUsers.slice(0, 5).map((user: MobileUser, index: number) => (
              <SocialCard
                key={`nearby-${user._id}`}
                user={user}
                onProfileClick={handleProfileClick}
                onChatClick={handleChatClick}
                index={index}
                variant="default"
                showInterests={true}
                showStats={true}
                showLocation={true}
              >
                <FollowButton
                  userId={user._id}
                  initialIsFollowing={user.isFollowing || false}
                  className="flex-1"
                />
                <button
                  onClick={() => handleChatClick(user._id)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-accent active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
              </SocialCard>
            ))}
          </div>
        </div>

        {/* New Users Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold text-foreground">New</h2>
          </div>
          <div className="space-y-3">
            {newUsers.slice(0, 5).map((user: MobileUser, index: number) => (
              <SocialCard
                key={`new-${user._id}`}
                user={user}
                onProfileClick={handleProfileClick}
                onChatClick={handleChatClick}
                index={index}
                variant="default"
                showInterests={true}
                showStats={true}
                showLocation={true}
              >
                <FollowButton
                  userId={user._id}
                  initialIsFollowing={user.isFollowing || false}
                  className="flex-1"
                />
                <button
                  onClick={() => handleChatClick(user._id)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-accent active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </button>
              </SocialCard>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MobileFriendPage;
