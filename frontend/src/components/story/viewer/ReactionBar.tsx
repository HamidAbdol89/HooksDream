// ReactionBar.tsx - Show reaction summary for story author
import React from 'react';
import { REACTION_TYPES } from '@/types/story';

interface ReactionBarProps {
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
  isVisible: boolean; // Only show for story author
  onClick?: () => void; // Click handler to open reactions dialog
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  isVisible,
  onClick
}) => {
  // Count reactions by type and get unique users
  const reactionSummary = React.useMemo(() => {
    const summary = new Map();
    const userReactions = new Map();
    
    // Keep only latest reaction per user
    reactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach(reaction => {
        if (!userReactions.has(reaction.userId._id)) {
          userReactions.set(reaction.userId._id, reaction);
        }
      });
    
    // Count by reaction type
    Array.from(userReactions.values()).forEach(reaction => {
      const count = summary.get(reaction.type) || 0;
      summary.set(reaction.type, count + 1);
    });
    
    return Array.from(summary.entries())
      .map(([type, count]) => ({
        type,
        count,
        emoji: REACTION_TYPES.find((r: any) => r.type === type)?.emoji || '❤️'
      }))
      .sort((a, b) => b.count - a.count) // Sort by count desc
      .slice(0, 3); // Show top 3 reaction types
  }, [reactions]);

  const totalReactions = reactionSummary.reduce((sum, r) => sum + r.count, 0);

  if (!isVisible || totalReactions === 0) {
    return null;
  }

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="group relative flex items-center bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 hover:from-pink-500/30 hover:to-purple-500/30 hover:border-white/30 transition-all duration-300 cursor-pointer shadow-lg"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300" />
      
      {/* Content */}
      <div className="relative flex items-center space-x-2">
        {/* Reaction emojis stack */}
        <div className="flex items-center -space-x-1">
          {reactionSummary.slice(0, 3).map(({ type, emoji }, index) => (
            <div 
              key={type} 
              className="relative flex items-center justify-center w-6 h-6 bg-white/20 rounded-full border border-white/30"
              style={{ zIndex: 3 - index }}
            >
              <span className="text-sm">{emoji}</span>
            </div>
          ))}
        </div>
        
        {/* Count badge */}
        <div className="flex items-center space-x-1">
          <span className="text-white font-semibold text-sm">
            {totalReactions}
          </span>
          <span className="text-white/70 text-xs font-medium">
            {totalReactions === 1 ? 'reaction' : 'reactions'}
          </span>
        </div>
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-pulse rounded-2xl" />
    </button>
  );
};
