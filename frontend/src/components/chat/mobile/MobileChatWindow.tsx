// components/chat/mobile/MobileChatWindow.tsx - Mobile chat window
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useChat } from '@/hooks/useChat';
import { MobileHeader } from './MobileHeader';
import { MessagesList } from '../shared/MessagesList';
import { MessageInput } from '../shared/MessageInput';

interface MobileChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export const MobileChatWindow: React.FC<MobileChatWindowProps> = ({ 
  conversationId,
  onBack 
}) => {
  const { token } = useGoogleAuth();
  const queryClient = useQueryClient();
  const { currentUserId } = useChat();
  
  // Get conversation details
  const { data: conversationData } = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: text
      })
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    
    // Refresh messages
    queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
  };

  return (
    <div className="md:hidden flex-1 flex flex-col bg-background h-full">
      {/* Mobile header with back button */}
      <MobileHeader
        title={otherParticipant?.displayName || otherParticipant?.username || 'Chat'}
        avatar={otherParticipant?.avatar}
        userId={otherParticipant?._id}
        showBack={true}
        onBack={onBack}
        showMore={true}
      />
      
      <MessagesList 
        messages={messages}
        currentUserId={currentUserId || ''}
        isLoading={isLoadingMessages}
      />
      
      <MessageInput 
        onSendMessage={handleSendMessage}
        disabled={!token}
      />
    </div>
  );
};
