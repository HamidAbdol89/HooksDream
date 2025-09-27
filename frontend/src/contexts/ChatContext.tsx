// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ selectedConversationId, setSelectedConversationId }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
