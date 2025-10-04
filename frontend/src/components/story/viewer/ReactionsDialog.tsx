// ReactionsDialog.tsx - Show detailed reactions like RepliesDialog
import React from 'react';
import { useTransition, animated } from '@react-spring/web';
import { X } from 'lucide-react';
import { REACTION_TYPES } from '@/types/story';
import { formatReplyTimeAgo } from '@/utils/timeAgo';

interface ReactionsDialogProps {
  show: boolean;
  reactions: Array<{
    _id: string;
    type: string;
    userId: {
      _id: string;
      displayName: string;
      avatar: string;
    };
    createdAt: string;
  }>;
  onClose: () => void;
}

export const ReactionsDialog: React.FC<ReactionsDialogProps> = ({
  show,
  reactions,
  onClose
}) => {
  // Get unique users with their latest reaction
  const uniqueUserReactions = React.useMemo(() => {
    const userReactions = new Map();
    
    // Sort by createdAt and keep only latest reaction per user
    reactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach(reaction => {
        if (!userReactions.has(reaction.userId._id)) {
          userReactions.set(reaction.userId._id, reaction);
        }
      });
    
    return Array.from(userReactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reactions]);

  // Modal transition
  const modalTransition = useTransition(show, {
    from: { opacity: 0, transform: 'translateY(100%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(100%)' },
    config: {
      tension: 300,
      friction: 30
    }
  });

  // Reactions list transition
  const reactionsTransition = useTransition(uniqueUserReactions, {
    keys: (reaction) => reaction.userId._id,
    from: { opacity: 0, scale: 0.8, transform: 'translateX(-20px)' },
    enter: { opacity: 1, scale: 1, transform: 'translateX(0px)' },
    leave: { opacity: 0, scale: 0.8, transform: 'translateX(20px)' },
    config: {
      tension: 400,
      friction: 25
    }
  });

  return (
    <>
      {modalTransition((style, item) =>
        item ? (
          <>
            {/* Backdrop */}
            <animated.div
              style={{ opacity: style.opacity }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={onClose}
            />
            
            {/* Dialog */}
            <animated.div
              style={style}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Reactions ({uniqueUserReactions.length})
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Reactions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {reactionsTransition((reactionStyle, reaction) => (
                  <animated.div
                    key={reaction.userId._id}
                    style={reactionStyle}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={reaction.userId.avatar}
                        alt={reaction.userId.displayName}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {reaction.userId.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatReplyTimeAgo(reaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Reaction Emoji */}
                    <div className="flex items-center">
                      <span className="text-2xl">
                        {REACTION_TYPES.find((r: any) => r.type === reaction.type)?.emoji || '❤️'}
                      </span>
                    </div>
                  </animated.div>
                ))}
                
                {uniqueUserReactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No reactions yet</p>
                  </div>
                )}
              </div>
            </animated.div>
          </>
        ) : null
      )}
    </>
  );
};
