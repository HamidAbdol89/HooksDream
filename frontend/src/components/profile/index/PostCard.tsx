import React, { useState, useEffect } from 'react'; 
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
  Repeat2,
} from 'lucide-react';
import { useLinkPreview, useUrlExtraction } from '@/hooks/useLinkPreview';
import { LinkPreviews } from '../../posts/LinkPreview';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useAppStore } from '@/store/useAppStore';
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
  onRepost?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  author,
  isOwnProfile,
  onLike,
  onSave,
  onDelete,
  onComment,
  onShare,
  onRepost
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [imageLoading, setImageLoading] = useState(post.images?.map(() => true) || []);
  
  // Link preview functionality
  const { hasUrls } = useUrlExtraction();
  const { previews, fetchMultiplePreviews } = useLinkPreview();

  // Auto-fetch link previews when component mounts
  useEffect(() => {
    if (post.content && hasUrls(post.content)) {
      fetchMultiplePreviews(post.content);
    }
  }, [post.content, hasUrls, fetchMultiplePreviews]);

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

  // Check if this is a repost
  const isRepost = !!post.repost_of;
  const originalPost = post.repost_of;
  const displayPost = isRepost ? originalPost : post;
  const displayAuthor = isRepost ? originalPost?.userId : author;

  return (
    <Card className="border-0 border-b border-border/40 rounded-none bg-transparent hover:bg-muted/20 transition-colors duration-200 group w-full max-w-none">
      {/* Repost indicator */}
      {isRepost && (
        <div className="px-3 sm:px-6 pt-3 pb-2">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Repeat2 className="h-4 w-4 text-green-600" />
            <Avatar className="h-5 w-5 ring-1 ring-border">
              <AvatarImage 
                src={author.avatar} 
                alt={author.displayName} 
              />
              <AvatarFallback className="text-xs bg-muted">
                {author.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground hover:underline cursor-pointer">{author.displayName}</span> đã repost
            </span>
          </div>
          
          {/* Repost comment inline */}
          {post.content && (
            <div className="mt-2 ml-7 text-sm">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                {detectAndFormatLinks(post.content)}
              </p>
            </div>
          )}
        </div>
      )}

      <CardHeader className={`pb-3 px-3 sm:px-6 ${isRepost ? 'pt-2' : ''}`}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-background shadow-sm flex-shrink-0">
              <AvatarImage 
                src={displayAuthor?.avatar ?? "/default-avatar.jpg"} 
                alt={displayAuthor?.username ?? "Anonymous"} 
              />
              <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {(displayAuthor?.username?.charAt(0).toUpperCase()) ?? "?"}
              </AvatarFallback>
            </Avatar>

            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                  {displayAuthor?.displayName}
                </h3>
                {displayAuthor?.isVerified && (
                  <Verified className="h-3 w-3 sm:h-4 sm:w-4 text-primary fill-primary/20 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="truncate">@{displayAuthor?.username}</span>
                <span className="text-muted-foreground/60">·</span>
                <time className="flex-shrink-0">{formatTimeAgo(displayPost?.createdAt || post.createdAt)}</time>
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
              {!isOwnProfile && !(isRepost && originalPost?.userId?._id === author._id) && (
                <DropdownMenuItem 
                  onClick={() => onRepost && onRepost(isRepost ? originalPost?._id || post._id : post._id)} 
                  className="cursor-pointer"
                >
                  <Repeat2 className="mr-2 h-4 w-4" />
                  Repost
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6">
        {/* Original post content or deleted message */}
        {isRepost ? (
          originalPost?.isDeleted ? (
            <div className="mb-4 mx-3 sm:mx-6">
              <div className="p-4 border border-dashed border-border/60 rounded-xl bg-muted/20 text-center">
                <p className="text-muted-foreground italic text-sm">
                  Bài gốc đã bị gỡ
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 mx-3 sm:mx-6">
              <div className="border border-border/60 rounded-xl bg-card/50 overflow-hidden shadow-sm">
                {originalPost?.content && (
                  <div className="p-4 pb-2">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base break-words">
                      {detectAndFormatLinks(originalPost.content)}
                    </p>
                  </div>
                )}
                
                {/* Original post media */}
                {originalPost?.images && originalPost.images.length > 0 && (
                  <div className={originalPost?.content ? "px-4 pb-4" : "p-0"}>
                    <div className={`
                      rounded-xl overflow-hidden border bg-muted/30
                      ${originalPost.images.length === 1 ? '' : 
                        originalPost.images.length === 2 ? 'grid grid-cols-2 gap-0.5' :
                        'grid grid-cols-2 grid-rows-2 gap-0.5'
                      }
                    `}>
                      {originalPost.images.slice(0, 4).map((image: string, index: number) => (
                        <div key={index} className="relative group bg-muted/50 overflow-hidden aspect-square">
                          <img
                            src={image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {originalPost?.video && (
                  <div className={originalPost?.content ? "px-4 pb-4" : "p-0"}>
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video 
                        controls 
                        className="w-full max-h-60 object-contain"
                        poster=""
                      >
                        <source src={originalPost.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <>
            {post.content && (
              <div className="mb-4">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base break-words">
                  {detectAndFormatLinks(post.content)}
                </p>
              </div>
            )}

            {/* Link Previews */}
            {previews.length > 0 && (
              <div className="mb-4">
                <LinkPreviews previews={previews} maxPreviews={2} />
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
          </>
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
                    onClick={() => onRepost && onRepost(isRepost ? originalPost?._id || post._id : post._id)}
                    className="rounded-full px-2 sm:px-3 py-1.5 sm:py-2 h-auto text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200"
                    disabled={isOwnProfile || (isRepost && originalPost?.userId?._id === author._id)}
                  >
                    <Repeat2 className="mr-1 sm:mr-1.5 h-4 w-4" />
                    <span className="font-medium text-xs sm:text-sm">{formatNumber((isRepost ? originalPost?.repostCount : post.repostCount) ?? 0)}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Repost</p>
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