// src/components/ui/SocialCard.tsx - Modern Social Media Card Component
import React from 'react';
import { motion } from 'framer-motion';
import { Crown, MapPin, Calendar, Users, MoreHorizontal } from 'lucide-react';
import { MobileUser } from '@/hooks/useUsersQuery';

interface SocialCardProps {
  user: MobileUser;
  onProfileClick: (userId: string) => void;
  onChatClick: (userId: string) => void;
  children?: React.ReactNode; // For action buttons
  showInterests?: boolean;
  showStats?: boolean;
  showLocation?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  index?: number;
}

const SocialCard: React.FC<SocialCardProps> = ({
  user,
  onProfileClick,
  onChatClick,
  children,
  showInterests = true,
  showStats = true,
  showLocation = true,
  variant = 'default',
  index = 0
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { delay: index * 0.05 }
    }
  };

  const getCardClasses = () => {
    const baseClasses = "bg-card rounded-2xl shadow-sm border border-border overflow-hidden";
    
    switch (variant) {
      case 'compact':
        return `${baseClasses} p-3`;
      case 'detailed':
        return `${baseClasses} p-6`;
      default:
        return `${baseClasses} p-4`;
    }
  };

  const getAvatarSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-12 h-12';
      case 'detailed':
        return 'w-16 h-16';
      default:
        return 'w-14 h-14';
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={getCardClasses()}
    >
      {/* Cover Image for detailed variant */}
      {variant === 'detailed' && user.coverImage && (
        <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/40 relative -m-6 mb-4">
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* User Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <img
            src={user.avatar || '/default-avatar.png'}
            alt={user.displayName}
            className={`${getAvatarSize()} rounded-full cursor-pointer ring-2 ring-border transition-transform hover:scale-105`}
            onClick={() => onProfileClick(user._id)}
          />
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => onProfileClick(user._id)}
            >
              {user.displayName}
            </h3>
            {user.isVerified && (
              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">@{user.username}</p>
          
          {user.bio && variant !== 'compact' && (
            <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
              {user.bio}
            </p>
          )}
          
          {/* Location and Join Date */}
          {showLocation && (user.location || user.joinedAt) && variant !== 'compact' && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </span>
              )}
              {user.joinedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(user.joinedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          
          {/* User Stats */}
          {showStats && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {user.followersCount || 0}
              </span>
              {user.mutualFollowers && user.mutualFollowers > 0 && (
                <span className="text-primary font-medium">
                  {user.mutualFollowers} mutual
                </span>
              )}
              {user.postsCount && (
                <span>{user.postsCount} posts</span>
              )}
            </div>
          )}
        </div>
        
        {/* More Options */}
        <button className="p-2 rounded-full hover:bg-accent active:scale-95 transition-all">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Interests Tags */}
      {showInterests && user.interests && user.interests.length > 0 && variant !== 'compact' && (
        <div className="flex flex-wrap gap-1 mb-3">
          {user.interests.slice(0, 3).map((interest, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
            >
              {interest}
            </span>
          ))}
          {user.interests.length > 3 && (
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
              +{user.interests.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Recommendation Reasons (for detailed variant) */}
      {variant === 'detailed' && user.recommendationReasons && user.recommendationReasons.length > 0 && (
        <div className="mb-3 p-2 bg-primary/10 rounded-lg">
          <p className="text-xs text-primary font-medium mb-1">Why you might know them:</p>
          <ul className="text-xs text-primary/80 space-y-1">
            {user.recommendationReasons.slice(0, 2).map((reason: string, i: number) => (
              <li key={i}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </motion.div>
  );
};

export default SocialCard;
