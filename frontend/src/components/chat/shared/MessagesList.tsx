// components/chat/shared/MessagesList.tsx - Shared messages list for both desktop and mobile
import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { MessageBubble } from '@/components/chat/shared/MessageBubble';
import { Message } from '@/types/chat';
import { useMessageStatus } from '@/hooks/useMessageStatus';

interface MessagesListProps {
  messages: Message[];
  currentUserId: string;
  conversationId: string;
  isLoading?: boolean;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  currentUserId,
  conversationId,
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { markAsRead } = useMessageStatus(conversationId);
  const prevMessagesLength = useRef(messages.length);
  const hasInitialScrolled = useRef<string | null>(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showNewMessagesBadge, setShowNewMessagesBadge] = useState(false);

  // Reset when switching conversations
  useEffect(() => {
    prevMessagesLength.current = messages.length;
    setNewMessagesCount(0);
    setShowNewMessagesBadge(false);
  }, [conversationId]);

  // Initial scroll to bottom when clicking on a conversation (1 lần duy nhất)
  useEffect(() => {
    if (messages.length > 0 && hasInitialScrolled.current !== conversationId) {
      // First time opening this conversation - scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        hasInitialScrolled.current = conversationId; // Mark as scrolled for this conversation
      }, 100);
    }
  }, [conversationId, messages.length]);

  // Smart handling: Auto-scroll hoặc hiển thị badge
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !messagesEndRef.current) return;

    // Skip if this conversation hasn't been initially scrolled yet
    if (hasInitialScrolled.current !== conversationId) {
      return;
    }

    // Check if this is a new message (not loading old messages)
    const hasNewMessages = messages.length > prevMessagesLength.current;
    
    if (hasNewMessages) {
      const newMessageCount = messages.length - prevMessagesLength.current;
      
      // Delay để đảm bảo DOM đã render
      setTimeout(() => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        
        if (scrollHeight === 0 || clientHeight === 0) {
          console.log('⏳ DOM not ready, skipping...');
          return;
        }
        
        // Simple check: Nếu không ở vị trí mới nhất (cuối cùng) → Hiện badge
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
        
        console.log('📱 Simple check:', {
          newMessageCount,
          scrollTop,
          scrollHeight,
          clientHeight,
          isAtBottom,
          showBadge: !isAtBottom
        });
        
        if (isAtBottom) {
          // Ở vị trí mới nhất → Auto-scroll
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          setShowNewMessagesBadge(false);
          setNewMessagesCount(0);
        } else {
          // Không ở vị trí mới nhất → Hiện badge
          setNewMessagesCount(prev => prev + newMessageCount);
          setShowNewMessagesBadge(true);
          console.log('🎯 Badge shows!');
        }
      }, 100);
    }
    
    // Update previous length
    prevMessagesLength.current = messages.length;
  }, [messages, conversationId]);

  // Handle click on new messages badge
  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessagesBadge(false);
    setNewMessagesCount(0);
  };

  // Mark unread messages as read when component mounts or messages change
  useEffect(() => {
    if (!messages.length) return;

    const unreadMessages = messages.filter(message => 
      message.sender._id !== currentUserId && // Not sent by current user
      !message.messageStatus?.readBy?.includes(currentUserId) // Not read by current user
    );

    if (unreadMessages.length > 0) {
      // Mark ALL unread messages as read in a single API call after delay
      const timer = setTimeout(() => {
        // Batch mark as read - gọi API 1 lần với array messageIds
        const messageIds = unreadMessages.map(msg => msg._id);
        markAsRead(messageIds[0]); // Tạm thời mark 1 message, sau sẽ fix để mark batch
      }, 2000); // Tăng delay lên 2 giây

      return () => clearTimeout(timer);
    }
  }, [messages, currentUserId, markAsRead]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/20 to-muted/5">
        <div className="flex justify-center items-center h-32">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <span className="ml-2">Loading messages...</span>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/20 to-muted/5">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4 md:p-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Start your conversation</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Send a message to begin chatting. Your messages are private and secure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/20 to-muted/5 relative"
    >
      <div className="p-2 md:p-2 space-y-2 md:space-y-2">
        {messages.map((message, index) => {
          const isOwn = message.sender._id === currentUserId;
          const showAvatar = index === 0 || messages[index - 1]?.sender._id !== message.sender._id;
          const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.sender._id !== message.sender._id;
          
          return (
            <MessageBubble
              key={`${message._id}-${index}`}
              message={message}
              isOwn={isOwn}
              conversationId={conversationId}
              showAvatar={showAvatar}
              isLastInGroup={isLastInGroup}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* New Messages Badge */}
      {showNewMessagesBadge && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={handleScrollToBottom}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 animate-bounce"
          >
            <span className="text-sm font-medium">
              {newMessagesCount === 1 
                ? '1 tin nhắn mới' 
                : `${newMessagesCount} tin nhắn mới`
              }
            </span>
            <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
          </button>
        </div>
      )}
     
    </div>
  );
};
