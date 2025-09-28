// components/chat/desktop/ChatWindow.tsx - Desktop chat window
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types/chat';
import { ChatHeader } from './ChatHeader';
import { MessagesList } from '@/components/chat/shared/MessagesList';
import { MessageInput } from '@/components/chat/shared/MessageInput';

interface ChatWindowProps {
  conversationId: string;
  replyingTo?: Message | null;
  onReply?: (message: Message) => void;
  onCancelReply?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversationId, 
  replyingTo, 
  onReply, 
  onCancelReply 
}) => {
  const { token } = useGoogleAuth();
  const queryClient = useQueryClient();
  const { currentUserId } = useChat();
  
  // Get conversation details
  const { data: conversationData } = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}`, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      return data.data;
    },
    enabled: !!conversationId && !!token,
  });
  
  // Get other participant info
  const otherParticipant = conversationData?.participants?.find(
    (p: any) => p._id !== currentUserId
  );
  
  // Get messages for this conversation
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!conversationId && !!token,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time feel
  });
  
  const messages = messagesData || [];
  
  // Send message function
  const handleSendMessage = async (text: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      }
    );
    
    if (!response.ok) throw new Error('Failed to send message');
    
    // Refresh messages
    queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <ChatHeader user={otherParticipant} />
      </div>
      
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-desktop">
        <MessagesList 
          messages={messages}
          currentUserId={currentUserId || ''}
          conversationId={conversationId}
          onReply={onReply}
        />
      </div>
      
      {/* Fixed Input */}
      <div className="flex-shrink-0">
        <MessageInput 
          conversationId={conversationId}
          disabled={!token}
          replyingTo={replyingTo}
          onCancelReply={onCancelReply}
        />
      </div>
    </div>
  );
};
