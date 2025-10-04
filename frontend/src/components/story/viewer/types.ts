// Shared types for Story Viewer components
import { Story } from '@/types/story';

export interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReaction: (storyId: string, reactionType: string, position?: { x: number; y: number }) => void;
  onReply: (storyId: string, message: string) => void;
  onView: (storyId: string, duration: number) => void;
}

export interface StoryProgressBarProps {
  stories: Story[];
  currentIndex: number;
  progress: number;
}

export interface StoryHeaderProps {
  story: Story;
  isPaused: boolean;
  isMuted: boolean;
  onPauseToggle: () => void;
  onMuteToggle: () => void;
  onClose: () => void;
  isOwnStory: boolean;
}

export interface StoryContentProps {
  story: Story;
  mediaAspectRatio: 'portrait' | 'landscape' | 'square';
  isMuted: boolean;
  onVideoLoadedMetadata: () => void;
  onVideoTimeUpdate: () => void;
  onImageLoad: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  imageRef: React.RefObject<HTMLImageElement>;
}

export interface StoryNavigationProps {
  currentIndex: number;
  totalStories: number;
  onPrevious: () => void;
  onNext: () => void;
}

export interface StoryActionsProps {
  currentIndex: number;
  totalStories: number;
  isOwnStory: boolean;
  onReactionToggle: () => void;
  onReplyToggle: () => void;
  onDeleteClick: () => void;
}

export interface ReactionPickerProps {
  show: boolean;
  onReactionClick: (reactionType: string, event: React.MouseEvent) => void;
}

export interface ReplyInputProps {
  show: boolean;
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export interface DeleteConfirmDialogProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export type MediaAspectRatio = 'portrait' | 'landscape' | 'square';
