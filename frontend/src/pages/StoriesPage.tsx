// StoriesPage.tsx - Clean Professional Stories Interface
import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Settings2, Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Story, CreateStoryData } from '@/types/story';
import { FloatingBubbleCanvas } from '@/components/story/FloatingBubbleCanvas';
import { StoryViewer } from '@/components/story/StoryViewer';
import { StoryCreator } from '@/components/story/StoryCreator';
import { useStories } from '@/hooks/useStories';
import { useIsMobile } from '@/hooks/useIsMobile';

export const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Prevent body scroll when on stories page
  React.useEffect(() => {
    document.body.classList.add('stories-page');
    return () => {
      document.body.classList.remove('stories-page');
    };
  }, []);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0);
  const [userStories, setUserStories] = useState<Story[]>([]); // Stories of selected user
  const [showCreator, setShowCreator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Use stories hook with React Query caching
  const {
    stories,
    isLoading,
    error,
    createStory,
    viewStory,
    addReaction,
    replyToStory,
  } = useStories({ limit: 50 });

  // Group stories by user
  const groupedStories = useMemo(() => {
    const groups = new Map<string, Story[]>();
    
    stories.forEach(story => {
      const userId = story.userId._id;
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(story);
    });
    
    // Convert to array and sort by latest story
    return Array.from(groups.entries()).map(([userId, userStories]) => {
      const sortedStories = userStories.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        userId,
        user: sortedStories[0].userId, // User info from latest story
        stories: sortedStories,
        latestStory: sortedStories[0],
        totalStories: sortedStories.length
      };
    }).sort((a, b) => 
      new Date(b.latestStory.createdAt).getTime() - new Date(a.latestStory.createdAt).getTime()
    );
  }, [stories]);

  // Event handlers
  const handleUserBubbleClick = useCallback((latestStory: Story) => {
    // Find the user group for this story
    const userGroup = groupedStories.find(group => 
      group.userId === latestStory.userId._id
    );
    
    if (userGroup) {
      setSelectedStory(latestStory);
      setSelectedStoryIndex(0);
      // Store the user's stories for StoryViewer
      setUserStories(userGroup.stories);
      viewStory(latestStory._id, 0);
    }
  }, [groupedStories, viewStory]);

  const handleCreateStory = useCallback(async (data: CreateStoryData) => {
    try {
      await createStory(data);
      setShowCreator(false);
    } catch (error) {
      console.error('Failed to create story:', error);
    }
  }, [createStory]);

  const handleCloseViewer = useCallback(() => {
    setSelectedStory(null);
  }, []);

  const handleNextStory = useCallback(() => {
    if (selectedStoryIndex < userStories.length - 1) {
      const nextIndex = selectedStoryIndex + 1;
      setSelectedStoryIndex(nextIndex);
      setSelectedStory(userStories[nextIndex]);
    }
  }, [selectedStoryIndex, userStories]);

  const handlePreviousStory = useCallback(() => {
    if (selectedStoryIndex > 0) {
      const prevIndex = selectedStoryIndex - 1;
      setSelectedStoryIndex(prevIndex);
      setSelectedStory(userStories[prevIndex]);
    }
  }, [selectedStoryIndex, userStories]);

  const handleReaction = useCallback((storyId: string, type: string, position?: { x: number; y: number }) => {
    addReaction(storyId, type, position || { x: 50, y: 50 });
  }, [addReaction]);

  const handleReply = useCallback((storyId: string, message: string, media?: File) => {
    replyToStory(storyId, message, media);
  }, [replyToStory]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading stories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Unable to load stories</h2>
          <p className="text-gray-600 dark:text-gray-400">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 overflow-hidden">
      {/* Desktop Buttons - Top Right */}
      {!isMobile && (
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-3">
          {/* Home Button */}
          <button
            onClick={() => navigate('/feed')}
            className={cn(
              "p-3 rounded-xl transition-all duration-200",
              "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg",
              "hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl",
              "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            )}
            title="Back to Feed"
          >
            <Home className="w-5 h-5" />
          </button>

       {/* Create Story Button */}
<button
  onClick={() => setShowCreator(true)}
  className={cn(
    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-150",
    "bg-purple-600 hover:bg-purple-700",
    "text-white font-medium shadow-sm"
  )}
  title="Create Story"
>
  <Plus className="w-4 h-4" />
  <span>Create Story</span>
</button>

        </div>
      )}

      {/* Main Canvas - Full Screen */}
      <FloatingBubbleCanvas
        stories={groupedStories.map(group => ({
          ...group.latestStory,
          storyCount: group.totalStories
        }))}
        onStoryClick={handleUserBubbleClick}
        onPositionUpdate={() => {}} // Empty handler for now
        className=""
      />

      {/* Mobile Floating Buttons */}
      {isMobile && (
        <>
          {/* Home Button - Bottom Left */}
          <button
            onClick={() => navigate('/feed')}
            className="fixed bottom-6 left-6 z-20 p-4 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 hover:scale-110"
          >
            <Home className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Create Story Button - Bottom Right */}
          <button
            onClick={() => setShowCreator(true)}
            className="fixed bottom-6 right-6 z-20 p-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg transition-all duration-200 hover:scale-110"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Empty State */}
      {stories.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-6 p-8">
            <div className="text-8xl">🫧</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                No stories yet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-md">
                Be the first to create a floating bubble story and share your moment with the world!
              </p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className={cn(
                "inline-flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                "text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              )}
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Story</span>
            </button>
          </div>
        </div>
      )}




      {/* Story Viewer */}
      <AnimatePresence>
        {selectedStory && userStories.length > 0 && (
          <StoryViewer
            stories={userStories}
            currentIndex={selectedStoryIndex}
            onClose={handleCloseViewer}
            onNext={handleNextStory}
            onPrevious={handlePreviousStory}
            onReaction={handleReaction}
            onReply={handleReply}
            onView={(storyId: string, duration: number) => viewStory(storyId, duration)}
          />
        )}
      </AnimatePresence>

      {/* Story Creator */}
      <AnimatePresence>
        {showCreator && (
          <StoryCreator
            onClose={() => setShowCreator(false)}
            onCreateStory={handleCreateStory}
            isOpen={showCreator}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesPage;
