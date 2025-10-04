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
  isPaused: boolean;
  onVideoLoadedMetadata: (videoElement: HTMLVideoElement) => void;
  onVideoTimeUpdate: (currentTime: number, duration: number) => void;
  onImageLoad: (imageElement: HTMLImageElement) => void;
  onPauseToggle: () => void;
  onRepliesToggle: () => void;
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
  story: Story;
  onReactionToggle: () => void;
  onReplyToggle: () => void;
  onDeleteClick: () => void;
  onPauseToggle: () => void;
  onReactionsClick?: () => void;
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
