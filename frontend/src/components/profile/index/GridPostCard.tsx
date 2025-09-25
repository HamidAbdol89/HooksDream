import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, ImageIcon, Play, Quote } from "lucide-react";
import { PostCardProps } from "@/store/useAppStore"; 

export const GridPostCard: React.FC<PostCardProps> = ({ post }) => {
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

  const hasMedia = post.images && post.images.length > 0;
  const hasVideo = post.video;
  const imageCount = post.images?.length || 0;

  return (
    <Card className="group overflow-hidden border-0 bg-card shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1 w-full max-w-none">
      {/* Media Section */}
      {hasMedia && post.images ? (
        <div className="relative aspect-square overflow-hidden">
          <img
            src={post.images[0]}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Media Count Badge */}
          {imageCount > 1 && (
            <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 backdrop-blur-sm text-xs">
              <ImageIcon className="mr-1 h-3 w-3" />
              {imageCount}
            </Badge>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Stats Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 text-white text-xs">
              <span className="flex items-center gap-1 backdrop-blur-sm bg-black/40 rounded-full px-2 py-1">
                <Heart className="h-3 w-3" />
                <span>{formatNumber(post.likeCount)}</span>
              </span>
              <span className="flex items-center gap-1 backdrop-blur-sm bg-black/40 rounded-full px-2 py-1">
                <MessageCircle className="h-3 w-3" />
                <span>{formatNumber(post.commentCount)}</span>
              </span>
            </div>
            <span className="text-white text-xs backdrop-blur-sm bg-black/40 rounded-full px-2 py-1">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      ) : hasVideo ? (
        <div className="relative aspect-square overflow-hidden bg-black">
          <video 
            className="w-full h-full object-cover"
            muted
          >
            <source src={post.video} type="video/mp4" />
          </video>
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-300">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
            </div>
          </div>
          
          {/* Stats Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center space-x-3 text-white text-xs">
              <span className="flex items-center space-x-1 backdrop-blur-sm bg-black/50 rounded-full px-2 py-1">
                <Heart className="h-3 w-3" />
                <span>{formatNumber(post.likeCount)}</span>
              </span>
              <span className="flex items-center space-x-1 backdrop-blur-sm bg-black/50 rounded-full px-2 py-1">
                <MessageCircle className="h-3 w-3" />
                <span>{formatNumber(post.commentCount)}</span>
              </span>
            </div>
            <span className="text-white text-xs backdrop-blur-sm bg-black/50 rounded-full px-2 py-1">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      ) : (
        /* Text-only Post */
        <div className="aspect-square bg-gradient-to-br from-muted via-muted/80 to-muted/60 p-4 sm:p-6 flex flex-col justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <Quote className="w-full h-full text-foreground" />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <p className="text-foreground font-medium leading-relaxed line-clamp-4 sm:line-clamp-6 text-center text-sm sm:text-base">
              {post.content}
            </p>
          </div>
          
          {/* Bottom Stats Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-3 sm:p-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>{formatNumber(post.likeCount)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{formatNumber(post.commentCount)}</span>
                </span>
              </div>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Content Section - Only for media posts */}
      {hasMedia && post.images && (
        <CardContent className="p-3 sm:p-4">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed break-words">
            {post.content}
          </p>
          
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer">
                <Heart className="h-3 w-3" />
                <span className="font-medium">{formatNumber(post.likeCount)}</span>
              </span>
              <span className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                <MessageCircle className="h-3 w-3" />
                <span className="font-medium">{formatNumber(post.commentCount)}</span>
              </span>
            </div>
            <time className="font-medium">{formatTimeAgo(post.createdAt)}</time>
          </div>
        </CardContent>
      )}
    </Card>
  );
};