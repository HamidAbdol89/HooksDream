// src/pages/FriendPageRQ.tsx - Optimized with React Query
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Crown, Clock, TrendingUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PopularUsersSection } from '@/components/feed/PopularUsersSection';
import { FollowButton } from '@/components/ui/FollowButton';
import { useSocial } from '@/hooks/useSocial';
import { useChat } from '@/hooks/useChat';
import { useAllUsers, usePopularUsers } from '@/hooks/useUsersQuery';

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

const FriendPageRQ: React.FC = () => {
  const navigate = useNavigate();
  const { } = useSocial();
  const { useDirectConversation } = useChat();
  
  // Reset scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // React Query hooks - No more manual API calls!
  const { data: allUsers = [], isLoading: isLoadingUsers, error } = useAllUsers(50);
  const { data: popularUsersRaw = [] } = usePopularUsers();
  
  // Ensure popular users are unique
  const popularUsers = popularUsersRaw.filter((user, index, self) => 
    index === self.findIndex(u => u._id === user._id)
  );
  
  // Filter out duplicates between allUsers and popularUsers, and ensure unique users
  const filteredAllUsers = allUsers
    .filter((user, index, self) => 
      // Remove duplicates within allUsers itself
      index === self.findIndex(u => u._id === user._id)
    )
    .filter(user => 
      // Remove users that are already in popularUsers
      !popularUsers.some(popularUser => popularUser._id === user._id)
    );

  // Local state for UI
  const [activeTab, setActiveTab] = useState<'discover' | 'popular'>('discover');

  // Handle click to start chat
  const handleChatClick = async (userId: string) => {
    try {
      // Note: useDirectConversation is a hook, need to handle differently
      // For now, navigate to messages page
      navigate(`/messages`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Handle profile navigation
  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Discover People</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'discover'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-1" />
                Discover
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'popular'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Popular
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoadingUsers && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load users</h3>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        )}

        {/* Content Tabs */}
        {!isLoadingUsers && !error && (
          <>
            {activeTab === 'discover' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Discover New People</h2>
                  <span className="text-sm text-muted-foreground">({filteredAllUsers.length} users)</span>
                </div>

                {filteredAllUsers.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAllUsers.map((user: User) => (
                      <div
                        key={`discover-${user._id}`}
                        className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full cursor-pointer"
                            onClick={() => handleProfileClick(user._id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3
                                className="font-medium truncate cursor-pointer hover:text-primary"
                                onClick={() => handleProfileClick(user._id)}
                              >
                                {user.displayName}
                              </h3>
                              {user.isVerified && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </p>
                            {user.bio && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{user.followersCount || 0} followers</span>
                              <span>{user.postsCount || 0} posts</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <FollowButton
                            userId={user._id}
                            initialIsFollowing={user.isFollowing || false}
                            size="sm"
                            className="flex-1"
                          />
                          <button
                            onClick={() => handleChatClick(user._id)}
                            className="p-2 rounded-md border hover:bg-accent transition-colors"
                            title="Send message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No users found</h3>
                    <p className="text-muted-foreground">Check back later for new people to discover</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'popular' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Popular Users</h2>
                  <span className="text-sm text-muted-foreground">({popularUsers.length} users)</span>
                </div>

                {/* Simple popular users display */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {popularUsers.map((user: User) => (
                    <div
                      key={`popular-${user._id}`}
                      className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={user.avatar || '/default-avatar.png'}
                          alt={user.displayName}
                          className="w-12 h-12 rounded-full cursor-pointer"
                          onClick={() => handleProfileClick(user._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className="font-medium truncate cursor-pointer hover:text-primary"
                              onClick={() => handleProfileClick(user._id)}
                            >
                              {user.displayName}
                            </h3>
                            {user.isVerified && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            @{user.username}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{user.followersCount || 0} followers</span>
                            <span>{user.postsCount || 0} posts</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <FollowButton
                          userId={user._id}
                          initialIsFollowing={user.isFollowing || false}
                          size="sm"
                          className="flex-1"
                        />
                        <button
                          onClick={() => handleChatClick(user._id)}
                          className="p-2 rounded-md border hover:bg-accent transition-colors"
                          title="Send message"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendPageRQ;
