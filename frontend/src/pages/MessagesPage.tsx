// pages/MessagesPage.tsx - Messages Page
import React, { useState } from 'react';
import { MessageSquare, Search, Plus, UserCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChat } from '@/hooks/useChat';
import { useSocial } from '@/hooks/useSocial';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChatContext } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConversationsList } from '@/components/chat/ConversationsList';
import { FollowingUsersList } from '@/components/chat/FollowingUsersList';
import { MobileHeader } from '@/components/chat/MobileHeader';

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
  const { selectedConversationId, setSelectedConversationId } = useChatContext();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
        return [];
      }
      
      const response = await fetch(`${API_BASE_URL}/api/users/${actualUserId}/following?limit=50`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data || [];
    },
    enabled: !!actualUserId && !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
      
      if (data?.success && data.data) {
        setSelectedConversationId(data.data._id);
        setActiveTab('conversations');
        
        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  return (
    <div className="w-full h-full flex bg-background">
      {/* Mobile: Show either sidebar or chat, Desktop: Show both */}
      <div className={`${
        selectedConversationId 
          ? 'hidden md:flex md:w-80 lg:w-96' 
          : 'flex w-full md:w-80 lg:w-96'
      } border-r border-border bg-background md:bg-card/50 md:backdrop-blur-sm flex-col`}>
        
        {/* Mobile Header */}
        <MobileHeader 
          title="Messages"
          showEdit={true}
          showSearch={true}
        />
        
        {/* Desktop Header */}
        <div className="hidden md:block p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
            <Button size="sm" variant="ghost" className="p-2">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Tabs - Instagram style */}
          <div className="flex border-b border-border mb-0">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'conversations'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chats</span>
              {activeTab === 'conversations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'following'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Following</span>
              {activeTab === 'following' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>
          
          {/* Search - Desktop only, mobile has it in header */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search following...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex border-b border-border">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'conversations'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chats
            {activeTab === 'conversations' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'following'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Following
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden p-3 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search following...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-0 rounded-xl"
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
              onSelectConversation={(conversationId, user) => {
                setSelectedConversationId(conversationId);
                setSelectedUser(user);
              }}
              isLoading={isLoading}
              error={error}
              onSwitchToFollowing={() => setActiveTab('following')}
            />
          ) : (
            <FollowingUsersList
              users={filteredFollowingUsers}
              onStartChat={(userId, user) => {
                startChatWithUser(userId);
                setSelectedUser(user || null);
              }}
              isLoading={isLoadingFollowing}
            />
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className={`${
        selectedConversationId 
          ? 'flex w-full md:flex-1' 
          : 'hidden md:flex md:flex-1'
      } flex-col bg-background relative`}>
        {selectedConversationId ? (
          <>
            {/* Mobile Chat Header - Instagram style */}
            <ChatWindowWithMobileHeader 
              conversationId={selectedConversationId} 
              user={selectedUser}
              onBack={() => {
                setSelectedConversationId(null);
                setSelectedUser(null);
              }} 
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Welcome to Messages
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Select a conversation from the sidebar to start messaging, or find people to chat with from your following list.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component wrapper để hiển thị user info trong mobile header
const ChatWindowWithMobileHeader: React.FC<{
  conversationId: string;
  user: User | null;
  onBack: () => void;
}> = ({ conversationId, user, onBack }) => {
  
  return (
    <>
      <MobileHeader 
        title={user?.displayName || user?.username || 'Chat Partner'}
        showBack={true}
        onBack={onBack}
        showMore={true}
        avatar={user?.avatar}
        userId={user?._id}
      />
      <ChatWindow conversationId={conversationId} />
    </>
  );
};

export default MessagesPage;
