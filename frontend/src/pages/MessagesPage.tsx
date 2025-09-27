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
// Import từ cấu trúc mới
import { ResponsiveChatWindow } from '@/components/chat/ResponsiveChatWindow';
import { MobileHeader } from '@/components/chat/mobile';
import { ConversationsList, FollowingUsersList } from '@/components/chat/desktop';

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
            <>
              {/* Desktop Conversations List */}
              <div className="hidden md:block">
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
              </div>
              
              {/* Mobile Conversations List */}
              <div className="md:hidden">
                {isLoading ? (
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                          <div className="w-12 h-12 bg-muted rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded mb-2" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredConversations.map((conversation: any) => {
                      const otherParticipant = conversation.participants?.find(
                        (p: any) => p._id !== currentUserId
                      );
                      
                      return (
                        <div
                          key={conversation._id}
                          onClick={() => {
                            setSelectedConversationId(conversation._id);
                            setSelectedUser(otherParticipant);
                          }}
                          className="flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            <img 
                              src={otherParticipant?.avatar || "/default-avatar.jpg"} 
                              alt={otherParticipant?.displayName}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.jpg';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {otherParticipant?.displayName || otherParticipant?.username || 'Unknown User'}
                              </h3>
                              {conversation.lastMessage?.createdAt && (
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {new Date(conversation.lastActivity).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage?.content?.text || 'Không có tin nhắn'}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0 ml-2">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {filteredConversations.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">Chưa có cuộc trò chuyện</h3>
                        <p className="text-sm text-muted-foreground">
                          Bắt đầu trò chuyện với bạn bè từ tab Following
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Desktop Following List */}
              <div className="hidden md:block">
                <FollowingUsersList
                  users={filteredFollowingUsers}
                  onStartChat={(userId, user) => {
                    startChatWithUser(userId);
                    setSelectedUser(user || null);
                  }}
                  isLoading={isLoadingFollowing}
                />
              </div>
              
              {/* Mobile Following List */}
              <div className="md:hidden">
                {isLoadingFollowing ? (
                  <div className="flex-1 p-4">
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                          <div className="w-12 h-12 bg-muted rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded mb-2" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredFollowingUsers.map((user: User) => (
                      <div
                        key={user._id}
                        onClick={() => {
                          startChatWithUser(user._id);
                          setSelectedUser(user);
                        }}
                        className="flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors"
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <img 
                            src={user.avatar || "/default-avatar.jpg"} 
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.jpg';
                            }}
                          />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {user.displayName || user.username}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            @{user.username} • Tap to message
                          </p>
                        </div>
                        
                        {/* Chat icon */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredFollowingUsers.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">Chưa theo dõi ai</h3>
                        <p className="text-sm text-muted-foreground">
                          Tìm và theo dõi bạn bè để bắt đầu trò chuyện
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
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
          <ResponsiveChatWindow 
            conversationId={selectedConversationId}
            onBack={() => {
              setSelectedConversationId(null);
              setSelectedUser(null);
            }} 
          />
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

// Interface để pass selectedConversationId lên ProtectedApp (theo memory về mobile chat navigation)
interface MessagesPageProps {
  onConversationSelect?: (conversationId: string | null) => void;
}

// Wrapper component để tích hợp với ProtectedApp navigation logic
const MessagesPageWrapper: React.FC<MessagesPageProps> = ({ onConversationSelect }) => {
  const { selectedConversationId } = useChatContext();
  
  // Notify ProtectedApp về conversation state để ẩn bottom nav khi đang chat (mobile)
  React.useEffect(() => {
    onConversationSelect?.(selectedConversationId);
  }, [selectedConversationId, onConversationSelect]);
  
  return <MessagesPage />;
};

// Export both components
export { MessagesPage, MessagesPageWrapper };
export default MessagesPage;
