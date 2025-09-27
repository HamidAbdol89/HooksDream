// components/chat/MessagesList.tsx
import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    text?: string;
    image?: string;
  };
  createdAt: string;
}

interface MessagesListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  currentUserId,
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/20 to-muted/5">
      <div className="p-3 md:p-6 space-y-3 md:space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.sender._id === currentUserId;
          const showAvatar = index === 0 || messages[index - 1]?.sender._id !== message.sender._id;
          const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.sender._id !== message.sender._id;
          
          return (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
              isLastInGroup={isLastInGroup}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
