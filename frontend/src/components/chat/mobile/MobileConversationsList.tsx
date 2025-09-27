// components/chat/mobile/MobileConversationsList.tsx - Mobile conversations list
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChat } from '@/hooks/useChat';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MobileConversationsListProps {
  onSelectConversation: (conversationId: string) => void;
}

export const MobileConversationsList: React.FC<MobileConversationsListProps> = ({
  onSelectConversation
}) => {
  const { token } = useGoogleAuth();
  const { currentUserId } = useChat();
  const { getUserStatus } = useOnlineUsers();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!token,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="md:hidden flex-1 p-4">
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
    );
  }

  return (
    <div className="md:hidden flex-1 overflow-y-auto">
      <div className="divide-y divide-border/50">
        {conversations.map((conversation: any) => {
          const otherParticipant = conversation.participants?.find(
            (p: any) => p._id !== currentUserId
          );
          
          const userStatus = otherParticipant?._id ? getUserStatus(otherParticipant._id) : { isOnline: false, lastSeenText: '' };
          
          return (
            <div
              key={conversation._id}
              onClick={() => onSelectConversation(conversation._id)}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors"
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={otherParticipant?.avatar || "/default-avatar.jpg"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                    {otherParticipant?.displayName?.charAt(0) || otherParticipant?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {userStatus.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {otherParticipant?.displayName || otherParticipant?.username || 'Unknown User'}
                  </h3>
                  {conversation.lastMessage?.createdAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { 
                        addSuffix: true, 
                        locale: vi 
                      })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage?.text || 'Không có tin nhắn'}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0 ml-2">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
                
                {/* Online status text */}
                <p className={`text-xs mt-1 ${userStatus.isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {userStatus.lastSeenText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">Chưa có cuộc trò chuyện</h3>
          <p className="text-sm text-muted-foreground">
            Bắt đầu trò chuyện với bạn bè từ trang chủ
          </p>
        </div>
      )}
    </div>
  );
};
