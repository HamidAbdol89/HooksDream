import React, { useState } from 'react'; 
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Trash2, 
  Verified,
  LinkIcon,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Post, Profile } from '@/store/useAppStore';

interface PostCardProps {
  post: Post;
  author: Profile;
  isOwnProfile: boolean;
  onLike: (postId: string) => void;
  onSave?: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  author,
  isOwnProfile,
  onLike,
  onSave,
  onDelete,
  onComment,
  onShare
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoading, setImageLoading] = useState(post.images?.map(() => true) || []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d`;
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleImageLoad = (index: number) => {
    setImageLoading(prev => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  const handleSave = () => {
    if (onSave) onSave(post._id);
    setIsSaved(!isSaved);
  };

  const extractDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const detectAndFormatLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 font-medium"
          >
            <LinkIcon className="h-3 w-3" />
            {extractDomainFromUrl(part)}
          </a>
        );
      }
      return part;
    });
  };

  const renderMediaGrid = () => {
    if (!post.images || post.images.length === 0) return null;
    
    const imageCount = post.images.length;
    
    return (
      <div className={`
        rounded-xl overflow-hidden border bg-muted/30 mb-4 mx-0
        ${imageCount === 1 ? '' : 
          imageCount === 2 ? 'grid grid-cols-2 gap-0.5' :
          imageCount === 3 ? 'grid grid-cols-2 grid-rows-2 gap-0.5' :
          'grid grid-cols-2 grid-rows-2 gap-0.5'
        }
      `}>
        {post.images.slice(0, 4).map((image: string, index: number) => (
          <div 
            key={index} 
            className={`
              relative group bg-muted/50 overflow-hidden
              ${imageCount === 1 ? 'aspect-video max-h-96' : 'aspect-square'}
              ${imageCount === 3 && index === 0 ? 'row-span-2' : ''}
              ${imageCount > 4 && index === 3 ? 'relative' : ''}
            `}
          >
            {imageLoading[index] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer h-full">
                  <img
                    src={image}
                    alt=""
                    className={`
                      w-full h-full object-cover transition-all duration-300 
                      group-hover:scale-105 group-hover:brightness-95
                      ${imageLoading[index] ? 'opacity-0' : 'opacity-100'}
                    `}
                    onLoad={() => handleImageLoad(index)}
                  />
                  
                  {imageCount > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        +{imageCount - 4}
                      </span>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur">
                <img src={image} alt="" className="w-full h-auto rounded-lg" />
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-0 border-b border-border/40 rounded-none bg-transparent hover:bg-muted/20 transition-colors duration-200 group w-full max-w-none">
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
     <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-background shadow-sm flex-shrink-0">
            <AvatarImage 
              src={author?.avatar ?? "/default-avatar.jpg"} 
              alt={author?.username ?? "Anonymous"} 
            />
            <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              {(author?.username?.charAt(0).toUpperCase()) ?? "?"}
            </AvatarFallback>
          </Avatar>

            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                  {author.displayName}
                </h3>
                {author.isVerified && (
                  <Verified className="h-3 w-3 sm:h-4 sm:w-4 text-primary fill-primary/20 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="truncate">@{author.username}</span>
                <span className="text-muted-foreground/60">·</span>
                <time className="flex-shrink-0">{formatTimeAgo(post.createdAt)}</time>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwnProfile && (
                <DropdownMenuItem 
                  onClick={() => onDelete(post._id)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSave} className="cursor-pointer">
                {isSaved ? (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Unsave post
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save post
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(post._id)} className="cursor-pointer">
                <Share2 className="mr-2 h-4 w-4" />
                Share post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6">
        {post.content && (
          <div className="mb-4">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base break-words">
              {detectAndFormatLinks(post.content)}
            </p>
          </div>
        )}

        {renderMediaGrid()}

        {post.video && (
          <div className="mb-4 -mx-3 sm:mx-0">
            <div className="relative rounded-none sm:rounded-xl overflow-hidden bg-black">
              <video 
                controls 
                className="w-full max-h-80 sm:max-h-96 object-contain"
                poster=""
              >
                <source src={post.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4 px-3 sm:px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 sm:gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLike(post._id)}
                    className={`
                      rounded-full px-2 sm:px-3 py-1.5 sm:py-2 h-auto transition-all duration-200
                      ${post.isLiked 
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' 
                        : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                      }
                    `}
                  >
                    <Heart className={`mr-1 sm:mr-1.5 h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium text-xs sm:text-sm">{formatNumber(post.likeCount)}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{post.isLiked ? 'Unlike' : 'Like'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onComment(post._id)}
                    className="rounded-full px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
                  >
                    <MessageCircle className="mr-1 sm:mr-1.5 h-4 w-4" />
                    <span className="font-medium text-xs sm:text-sm">{formatNumber(post.commentCount)}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onShare(post._id)}
                    className="rounded-full px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200"
                  >
                    <Share2 className="mr-1 sm:mr-1.5 h-4 w-4" />
                    <span className="font-medium text-xs sm:text-sm">{formatNumber(post.shareCount ?? 0)}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSave}
                  className={`
                    rounded-full p-2 h-auto transition-all duration-200
                    ${isSaved 
                      ? 'text-primary hover:text-primary/80 hover:bg-primary/10' 
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                    }
                  `}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSaved ? 'Unsave' : 'Save'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
};