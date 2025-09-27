// pages/MessagesPage.tsx - Messages Page
import React, { useState } from 'react';
import { MessageSquare, Search, Plus, UserCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChat } from '@/hooks/useChat';
import { useSocial } from '@/hooks/useSocial';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConversationsList } from '@/components/chat/ConversationsList';
import { FollowingUsersList } from '@/components/chat/FollowingUsersList';

// Types
interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

const MessagesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { useConversations, useDirectConversation, currentUserId } = useChat();
  const { useCurrentProfile } = useSocial();
  const { token } = useGoogleAuth(); // Use token from auth hook
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conversations' | 'following'>('conversations');
  
  // Get current user data
  const { data: currentUserData } = useCurrentProfile();
  const actualUserId = currentUserId || currentUserData?.data?._id;
  
  // API setup
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  
  // Get conversations list
  const { data: conversationsData, isLoading, error } = useConversations({ limit: 20 });
  const conversations = conversationsData?.data || [];
  
  // Get following users (using same pattern as FollowerListModal)
  const { data: followingUsers = [], isLoading: isLoadingFollowing, error: followingError } = useQuery({
    queryKey: ['following', actualUserId],
    queryFn: async () => {
      if (!actualUserId || !token) {
        console.log('⚠️ MessagesPage: Missing actualUserId or token', { actualUserId, token: !!token });
        return [];
      }
      
      console.log('🔍 MessagesPage fetching following for userId:', actualUserId);
      console.log('🔍 API URL:', `${API_BASE_URL}/api/users/${actualUserId}/following?limit=50`);
      
      const response = await fetch(`${API_BASE_URL}/api/users/${actualUserId}/following?limit=50`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Following fetch failed:', response.status, response.statusText, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Following data received:', data);
      console.log('📊 Following users count:', data.data?.length || 0);
      return data.data || data || [];
    },
    enabled: !!actualUserId && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  // Debug logs
  console.log('🛠️ MessagesPage Debug:', {
    actualUserId,
    token: !!token,
    followingUsers,
    followingUsersLength: followingUsers?.length,
    isLoadingFollowing,
    followingError,
    activeTab
  });
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    const otherParticipant = conversation.participants.find(p => p._id !== currentUserId);
    return otherParticipant?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           otherParticipant?.username?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Filter following users based on search
  const filteredFollowingUsers = followingUsers.filter((user: User) => {
    if (!searchTerm) return true;
    return user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.username?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Start chat with a user
  const startChatWithUser = async (userId: string) => {
    try {
      console.log('🚀 Starting chat with userId:', userId);
      
      // Call API directly to create or get conversation
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/direct/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Conversation created/found:', data);
      
      if (data?.success && data.data) {
        setSelectedConversationId(data.data._id);
        setActiveTab('conversations');
        console.log('🎯 Conversation selected:', data.data._id);
        
        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      }
    } catch (error) {
      console.error('❌ Failed to start chat:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-screen flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
            <Button size="sm" variant="ghost" className="p-2">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-muted rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'following'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Following
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search following...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Content List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'conversations' ? (
            <ConversationsList
              conversations={filteredConversations}
              currentUserId={currentUserId || ''}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              isLoading={isLoading}
              error={error}
              onSwitchToFollowing={() => setActiveTab('following')}
            />
          ) : (
            <FollowingUsersList
              users={filteredFollowingUsers}
              onStartChat={startChatWithUser}
              isLoading={isLoadingFollowing}
            />
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
