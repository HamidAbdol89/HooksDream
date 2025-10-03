// Story Types - Innovative Floating Bubble Stories
export interface StoryPosition {
  x: number; // 0-100%
  y: number; // 0-100%
  z: number; // Depth layer 0-10
  velocity: {
    x: number; // -1 to 1
    y: number; // -1 to 1
  };
  scale: number; // 0.5 to 2.0
}

export interface StoryVisualEffects {
  bubbleStyle: 'glass' | 'neon' | 'gradient' | 'holographic' | 'minimal';
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animation: 'float' | 'pulse' | 'rotate' | 'bounce' | 'wave';
  particles: {
    enabled: boolean;
    type: 'sparkles' | 'bubbles' | 'stars' | 'hearts' | 'fire';
    intensity: number; // 1-10
  };
}

export interface StoryMedia {
  type: 'image' | 'video' | 'audio' | 'text';
  url?: string;
  thumbnail?: string;
  duration?: number; // For videos/audio in seconds
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface StorySettings {
  visibility: 'public' | 'followers' | 'close_friends' | 'private';
  closeFriends?: string[];
  allowReplies: boolean;
  allowReactions: boolean;
  backgroundMusic?: {
    url: string;
    title: string;
    artist: string;
    startTime: number;
  };
}

export interface StoryReaction {
  _id: string;
  userId: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  type: 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'fire' | 'sparkle' | 'heart_eyes';
  position: {
    x: number;
    y: number;
  };
  createdAt: string;
}

export interface StoryView {
  userId: string;
  viewedAt: string;
  duration: number;
}

export interface StoryReply {
  _id: string;
  userId: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  message: string;
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
  };
  createdAt: string;
}

export interface Story {
  _id: string;
  userId: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
  };
  content: string;
  media: StoryMedia;
  visualEffects: StoryVisualEffects;
  position: StoryPosition;
  settings: StorySettings;
  views: StoryView[];
  viewCount: number;
  reactions: StoryReaction[];
  replies: StoryReply[];
  isHighlighted: boolean;
  highlightCategory?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  hasViewed?: boolean;
  isOwn?: boolean;
  timeRemaining?: number; // Seconds until expiry
}

export interface StoryAnalytics {
  viewCount: number;
  reactionCount: number;
  replyCount: number;
  views: Array<{
    user: {
      _id: string;
      username: string;
      displayName: string;
      avatar: string;
    };
    viewedAt: string;
    duration: number;
  }>;
  reactions: Array<{
    user: {
      _id: string;
      username: string;
      displayName: string;
      avatar: string;
    };
    type: string;
    position: { x: number; y: number };
    createdAt: string;
  }>;
  averageViewDuration: number;
  engagementRate: number;
}

export interface CreateStoryData {
  content?: string;
  mediaType: 'image' | 'video' | 'audio' | 'text';
  media?: File;
  visualEffects?: Partial<StoryVisualEffects>;
  settings?: Partial<StorySettings>;
  position?: Partial<StoryPosition>;
}

export interface StoryBubbleProps {
  story: Story;
  onClick: (story: Story) => void;
  onPositionUpdate?: (storyId: string, position: StoryPosition) => void;
  isActive?: boolean;
  className?: string;
}

export interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReaction: (storyId: string, type: string, position: { x: number; y: number }) => void;
  onReply: (storyId: string, message: string, media?: File) => void;
  onView: (storyId: string, duration: number) => void;
}

export interface StoryCreatorProps {
  onCreateStory: (data: CreateStoryData) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export interface FloatingBubbleCanvasProps {
  stories: Story[];
  onStoryClick: (story: Story) => void;
  onPositionUpdate: (storyId: string, position: StoryPosition) => void;
  className?: string;
}

// Physics simulation types
export interface BubblePhysics {
  gravity: number;
  friction: number;
  bounce: number;
  collision: boolean;
  magnetism: number;
}

export interface StoryBubbleState {
  position: StoryPosition;
  velocity: { x: number; y: number };
  isColliding: boolean;
  isDragging: boolean;
  lastUpdate: number;
}

// API Response types
export interface StoryApiResponse {
  success: boolean;
  message?: string;
  data?: Story | Story[];
  count?: number;
  error?: string;
}

export interface StoryHighlights {
  [category: string]: Story[];
}

// Hook types
export interface UseStoriesReturn {
  stories: Story[];
  isLoading: boolean;
  error: string | null;
  createStory: (data: CreateStoryData) => Promise<void>;
  viewStory: (storyId: string, duration: number) => Promise<void>;
  addReaction: (storyId: string, type: string, position: { x: number; y: number }) => Promise<void>;
  replyToStory: (storyId: string, message: string, media?: File) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  highlightStory: (storyId: string, category: string) => Promise<void>;
  updatePosition: (storyId: string, position: StoryPosition) => Promise<void>;
  refreshStories: () => Promise<void>;
}

export interface UseStoryPhysicsReturn {
  bubbleStates: Map<string, StoryBubbleState>;
  updateBubblePosition: (storyId: string, position: StoryPosition) => void;
  startPhysicsSimulation: () => void;
  stopPhysicsSimulation: () => void;
  resetPhysics: () => void;
}

// Constants
export const STORY_BUBBLE_STYLES = {
  glass: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
  },
  neon: {
    background: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #00ff88',
    boxShadow: '0 0 20px #00ff88, inset 0 0 20px rgba(0, 255, 136, 0.1)'
  },
  gradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
  },
  holographic: {
    background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #06ffa5)',
    backgroundSize: '400% 400%',
    animation: 'holographic 3s ease infinite',
    border: 'none'
  },
  minimal: {
    background: 'rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
  }
};

export const STORY_ANIMATIONS = {
  float: 'float 6s ease-in-out infinite',
  pulse: 'pulse 2s ease-in-out infinite',
  rotate: 'rotate 10s linear infinite',
  bounce: 'bounce 2s ease-in-out infinite',
  wave: 'wave 4s ease-in-out infinite'
};

export const REACTION_TYPES = [
  { type: 'love', emoji: '❤️', color: '#ff3040' },
  { type: 'laugh', emoji: '😂', color: '#ffd700' },
  { type: 'wow', emoji: '😮', color: '#ff8c00' },
  { type: 'sad', emoji: '😢', color: '#4169e1' },
  { type: 'angry', emoji: '😠', color: '#dc143c' },
  { type: 'fire', emoji: '🔥', color: '#ff4500' },
  { type: 'sparkle', emoji: '✨', color: '#daa520' },
  { type: 'heart_eyes', emoji: '😍', color: '#ff69b4' }
];

export const PHYSICS_CONFIG: BubblePhysics = {
  gravity: 0.05, // Reduced gravity for gentler movement
  friction: 0.99, // Higher friction to slow down faster
  bounce: 0.5, // Less bouncy for more stable positioning
  collision: true,
  magnetism: 0.01 // Reduced magnetism to prevent clustering
};
