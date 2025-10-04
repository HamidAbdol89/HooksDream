// RepliesDialog.tsx - Dialog to show all story replies
import React from 'react';
import { useTransition, animated } from '@react-spring/web';
import { X } from 'lucide-react';
import { formatReplyTimeAgo } from '@/utils/timeAgo';
import { StoryReply } from '@/types/story';

interface RepliesDialogProps {
  show: boolean;
  replies: StoryReply[];
  onClose: () => void;
}

export const RepliesDialog: React.FC<RepliesDialogProps> = ({
  show,
  replies,
  onClose
}) => {
  const dialogTransition = useTransition(show, {
    from: { opacity: 0, scale: 0.95, y: 20 },
    enter: { opacity: 1, scale: 1, y: 0 },
    leave: { opacity: 0, scale: 0.95, y: 20 },
    config: {
      tension: 300,
      friction: 30
    }
  });

  const repliesTransition = useTransition(replies, {
    from: { opacity: 0, x: -20 },
    enter: { opacity: 1, x: 0 },
    leave: { opacity: 0, x: 20 },
    trail: 50,
    config: {
      tension: 400,
      friction: 25
    }
  });

  return dialogTransition((style, item) =>
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
              Replies ({replies.length})
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Replies List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {repliesTransition((replyStyle, reply) => (
              <animated.div
                key={reply._id}
                style={replyStyle}
                className="flex items-start space-x-3"
              >
                <img
                  src={reply.userId.avatar}
                  alt={reply.userId.displayName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {reply.userId.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatReplyTimeAgo(reply.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                    {reply.message}
                  </p>
                  
                  {/* Media attachment if exists */}
                  {reply.media && (
                    <div className="mt-2">
                      {reply.media.type === 'image' && (
                        <img
                          src={reply.media.url}
                          alt="Reply attachment"
                          className="max-w-xs rounded-lg"
                        />
                      )}
                      {reply.media.type === 'video' && (
                        <video
                          src={reply.media.url}
                          controls
                          className="max-w-xs rounded-lg"
                        />
                      )}
                    </div>
                  )}
                </div>
              </animated.div>
            ))}
            
            {replies.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No replies yet</p>
              </div>
            )}
          </div>
        </animated.div>
      </>
    ) : null
  );
};
