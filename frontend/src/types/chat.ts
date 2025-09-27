// types/chat.ts - Chat related types
export interface User {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface MessageStatus {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
  readBy?: string[]; // Array of user IDs who read the message
}

export interface Message {
  _id: string;
  sender: User;
  content: {
    text?: string;
    image?: string;
    video?: {
      url: string;
      duration?: number;
      thumbnail?: string;
    };
    audio?: {
      url: string;
      duration?: number;
      waveform?: number[];
    };
  };
  type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  createdAt: string;
  updatedAt?: string;
  messageStatus?: MessageStatus;
  isEdited?: boolean;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: {
    _id: string;
    content: {
      text?: string;
      image?: string;
      video?: {
        url: string;
        duration?: number;
        thumbnail?: string;
      };
      audio?: {
        url: string;
        duration?: number;
        waveform?: number[];
      };
    };
    type?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
    sender: User;
    createdAt: string;
    messageStatus?: MessageStatus;
  };
  lastActivity: string;
  unreadCount?: number;
  hasNewMessage?: boolean; // Để highlight conversation
  isTyping?: boolean;
  typingUsers?: string[]; // Array of user IDs currently typing
}
