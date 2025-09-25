// src/components/feed/PostItem.tsx
import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, MoreHorizontal, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar';
import { MediaWithFallback } from './MediaWithFallback';
import { Post } from './types';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PostItemProps {
  post: Post;
  onLike: (postId: string) => void;
  onFollow: (userId: string, currentStatus: boolean) => void;
  isFollowLoading: boolean;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  onLike,
  onFollow,
  isFollowLoading
}) => {
  const { isConnected } = useGoogleAuth();
  const { t } = useTranslation('common');
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isExpanded, setIsExpanded] = useState(false);
const [commentCount, setCommentCount] = useState<number | null>(null);

  const hasMedia = (post.images && post.images.length > 0) || post.video;
  const contentExceedsLimit = post.content.length > 150;
  const displayContent = isExpanded 
    ? post.content 
    : (contentExceedsLimit ? post.content.substring(0, 150) + '...' : post.content);

  const handleLike = () => {
    if (!isConnected) return;
    
    // Optimistic UI update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    // Call the actual like handler
    onLike(post._id);
  };

  const handleFollowClick = () => {
    if (!isConnected) return;
    onFollow(post.userId._id, post.userId.isFollowing || false);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: vi 
      });
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments/count?postId=${post._id}`);
      if (!res.ok) {
        console.error("Fetch failed:", res.status, res.statusText);
        setCommentCount(0);
        return;
      }
      const data = await res.json();
      setCommentCount(data.count);
    } catch (error) {
      console.error("Error fetching comment count:", error);
      setCommentCount(0);
    }
  };

  fetchComments();
}, [post._id]);


  return (
    <div className="bg-card border rounded-3xl overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 ring-2 ring-border">
            <AvatarImage 
              src={post.userId.avatar} 
              alt={post.userId.displayName || post.userId.username} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
              {(post.userId.displayName || post.userId.username)?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {post.userId.displayName || post.userId.username}
            </p>
            <p className="text-xs text-muted-foreground">
              @{post.userId.username} • {formatDate(post.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!post.userId.isFollowing && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 rounded-xl text-xs font-medium"
              onClick={handleFollowClick}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <UserCheck className="w-3 h-3" />
              ) : (
                <UserPlus className="w-3 h-3 mr-1" />
              )}
              {t('common.follow') || 'Theo dõi'}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-xl"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-foreground text-sm whitespace-pre-line">
            {displayContent}
            {contentExceedsLimit && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-primary font-medium ml-1"
              >
                {t('common.readMore') || 'Xem thêm'}
              </button>
            )}
          </p>
        </div>
      )}

 {/* Media */}
{hasMedia && (
  <div className="relative">
    {post.video ? (
      <MediaWithFallback
        mediaPath={post.video}
        alt="Post video"
        className="w-full max-h-[500px] object-contain bg-black"
        isVideo={true}
      />
    ) : (post.images?.length ?? 0) === 1 ? (
      <MediaWithFallback
        mediaPath={post.images![0]}
        alt="Post image"
        className="w-full max-h-[500px] object-contain"
      />
    ) : (post.images?.length ?? 0) > 1 ? (
      <div className="grid grid-cols-2 gap-1 p-1">
        {post.images!.slice(0, 4).map((image, index) => (
          <div
            key={index}
            className={`relative ${
              post.images!.length > 2 && index === 3
                ? 'after:content-[""] after:absolute after:inset-0 after:bg-black/50 after:flex after:items-center after:justify-center after:text-white after:text-lg after:font-bold'
                : ''
            }`}
          >
            <MediaWithFallback
              mediaPath={image}
              alt={`Post image ${index + 1}`}
              className="w-full h-40 object-cover"
            />
            {post.images!.length > 4 && index === 3 && (
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg bg-black/50">
                +{post.images!.length - 3}
              </div>
            )}
          </div>
        ))}
      </div>
    ) : null}
  </div>
)}

      {/* Post Actions */}
      <div className="p-3 flex items-center justify-between border-t">
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-3 rounded-xl ${isLiked ? 'text-destructive' : 'text-muted-foreground'}`}
          onClick={handleLike}
          disabled={!isConnected}
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
          {likeCount > 0 && (
            <span className="text-xs font-medium">
              {likeCount}
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 rounded-xl text-muted-foreground"
          disabled={!isConnected}
        >
          <MessageSquare className="w-4 h-4 mr-1" />
        {commentCount !== null && (
  <span className="text-xs font-medium">{commentCount}</span>
)}

        </Button>
      </div>
    </div>
  );
};