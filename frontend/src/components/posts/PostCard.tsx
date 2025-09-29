// src/components/posts/PostCard.tsx
import React, { useState, useEffect, memo, useCallback, useMemo, startTransition, lazy, Suspense } from 'react';
import { Repeat2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { PostHeader } from './PostHeader';
import { PostContent } from '@/components/posts/PostContent';
import { PostMedia } from '@/components/posts/PostMedia';
import { PostActions } from '@/components/posts/PostActions';
import { EngagementStats } from '@/components/posts/EngagementStats';
import { CommentInput } from '@/components/comment/CommentInput';
import { CommentSection } from '@/components/comment/CommentSection';
import { usePostInteractions } from '@/components/posts/hooks/usePostInteractions';
import { useImageModal } from '@/components/posts/hooks/useImageModal';
import { Post } from '@/types/post';
import { UserProfile } from '@/types/user';
import { api } from '@/services/api';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { performanceMonitor } from '@/utils/simplePerformance';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '@/utils/formatters';
import { FollowButton } from '@/components/ui/FollowButton';

// Lazy load ImageModal for better code splitting
const ImageModal = lazy(() => import('./ImageModal').then(module => ({ default: module.ImageModal })));

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onFollow?: () => void;
  isFollowLoading?: boolean;
  currentUserHashId?: string; 
  currentUser?: UserProfile;
  onPostUpdate?: (updatedPost: Post) => void; // THÊM PROP MỚI
}

export const PostCard: React.FC<PostCardProps> = memo(({ 
  post, 
  onLike, 
  onComment, 
  onShare, 
  onBookmark,
  onFollow,
  isFollowLoading = false,
  currentUserHashId,
  currentUser,
  onPostUpdate // NHẬN PROP MỚI
}) => {
  const {
    isExpanded,
    setIsExpanded,
    showComments,
    setShowComments,
    isBookmarked,
    handleBookmark
  } = usePostInteractions(post, onBookmark);

  const navigate = useNavigate();

  const {
    isModalOpen,
    modalImageIndex,
    modalImages,
    openImageModal,
    closeImageModal,
    goToNextImage,
    goToPrevImage,
    downloadImage,
    setModalImageIndex
  } = useImageModal();

  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [isRefreshing, setIsRefreshing] = useState(false); // THÊM STATE


  const handleShowLikes = useCallback(() => {
    if (post.likeCount > 0) {
      setShowLikesDialog(true);
    }
  }, [post.likeCount]);

  const handleCommentCreated = useCallback(() => {
    const interactionStart = performance.now();
    
    // Optimistic update: Tăng comment count ngay lập tức
    if (onPostUpdate) {
      onPostUpdate({
        ...post,
        commentCount: (post.commentCount || 0) + 1
      });
    }
    
    // Track interaction performance
    const interactionTime = performance.now() - interactionStart;
    performanceMonitor.trackInteraction('comment-created', interactionTime);
    
    // Đồng bộ với server sau (không cần chờ) - sử dụng startTransition
    startTransition(() => {
      setTimeout(async () => {
        try {
          const apiStart = performance.now();
          const response = await api.post.getPost(post._id);
          const apiDuration = performance.now() - apiStart;
          
          performanceMonitor.trackAPICall(`getPost/${post._id}`, apiDuration, response.success);
          
          if (response.success && response.data) {
            onPostUpdate?.(response.data);
          }
        } catch (error) {
          console.error('Error syncing comment count:', error);
        }
      }, 1000);
    });
  }, [post._id, post.commentCount, onPostUpdate]);

// THÊM useEffect vào PostCard.tsx
useEffect(() => {
  // Đồng bộ commentCount từ post prop khi post thay đổi
  setCommentCount(post.commentCount);
}, [post.commentCount]);

  // More flexible user comparison for Google Auth
  const { profile: googleAuthProfile } = useGoogleAuth();
  const fallbackUser = currentUser || googleAuthProfile;
  const isOwnProfile = !!(fallbackUser && post.userId && (
    post.userId._id === (fallbackUser as any)._id ||
    post.userId._id === fallbackUser.id ||
    post.userId._id === (fallbackUser as any).googleId ||
    String(post.userId._id) === String(fallbackUser.id)
  ));

  // Check if this is a repost
  const isRepost = !!post.repost_of;
  const originalPost = post.repost_of;
  const displayPost = isRepost ? originalPost : post;
  const displayUser = isRepost ? originalPost?.userId : post.userId;

  // Custom handleUserClick to navigate to correct user (original post author, not reposter)
  const handleUserClick = useCallback(() => {
    const targetUser = displayUser || post.userId;
    navigate(`/profile/${targetUser._id || targetUser.username}`);
  }, [displayUser, post.userId, navigate]);

  return (
    <article className="bg-background/95 backdrop-blur-sm border-0 border-b border-border/50 hover:bg-background/98 transition-all duration-300 group">
      {/* Repost indicator */}
      {isRepost && (
        <div className="px-3 sm:px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Repeat2 className="h-4 w-4 text-green-600" />
            <Avatar className="h-5 w-5 ring-1 ring-border">
              <AvatarImage 
                src={post.userId.avatar} 
                alt={post.userId.displayName} 
              />
              <AvatarFallback className="text-xs bg-muted">
                {post.userId.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground hover:underline cursor-pointer">{post.userId.displayName}</span> đã repost
            </span>
          </div>
          
          {/* Repost comment inline */}
          {post.content && (
            <div className="mt-2 ml-7 text-sm">
              <PostContent
                content={post.content}
                isExpanded={isExpanded}
                onToggleExpand={useCallback(() => setIsExpanded(!isExpanded), [isExpanded])}
              />
            </div>
          )}
        </div>
      )}

      <div className="px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <button 
              onClick={handleUserClick}
              className="flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-background">
                <AvatarImage 
                  src={displayUser?.avatar} 
                  alt={displayUser?.displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs sm:text-sm font-semibold">
                  {displayUser?.displayName?.charAt(0)?.toUpperCase() || displayUser?.username?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </button>

            <div className="flex-1 min-w-0">
              <button 
                onClick={handleUserClick}
                className="block text-left transition-colors duration-200 hover:text-primary"
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {displayUser?.displayName || displayUser?.username}
                  </h3>
                  {displayUser?.isVerified && (
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </div>
                
                {displayUser?.username !== displayUser?.displayName && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    @{displayUser?.username}
                  </p>
                )}
              </button>

              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimeAgo(displayPost?.createdAt || post.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Follow button */}
          {onFollow && !isOwnProfile && displayUser?._id && (
            <FollowButton
              userId={displayUser._id}
              initialIsFollowing={displayUser.isFollowing}
              username={displayUser.username}
              size="sm"
              className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm"
            />
          )}
        </div>
      </div>

      {/* Original post content or deleted message */}
      {isRepost ? (
        <div className="px-3 sm:px-4">
          {originalPost?.isDeleted ? (
            <div className="mb-3">
              <div className="p-4 border border-dashed border-border/60 rounded-xl bg-muted/20 text-center">
                <p className="text-muted-foreground italic text-sm">
                  Bài gốc đã bị gỡ
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <div className="border border-border/60 rounded-xl bg-card/50 overflow-hidden shadow-sm">
                {/* Original post content */}
                {originalPost?.content && (
                  <div className="p-4 pb-2">
                    <PostContent
                      content={originalPost.content}
                      isExpanded={true}
                      onToggleExpand={() => {}}
                    />
                  </div>
                )}
                
                {/* Original post media */}
                {(originalPost?.images || originalPost?.video) && (
                  <div className={originalPost?.content ? "px-4 pb-4" : "p-0"}>
                    <PostMedia
                      images={originalPost.images}
                      video={originalPost.video}
                      content={originalPost.content}
                      onImageClick={openImageModal}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Content */}
          <PostContent
            content={post.content}
            isExpanded={isExpanded}
            onToggleExpand={useCallback(() => setIsExpanded(!isExpanded), [isExpanded])}
          />

          {/* Media */}
          <PostMedia
            images={post.images}
            video={post.video}
            content={post.content}
            onImageClick={openImageModal}
          />
        </>
      )}

      {/* Image Modal with Suspense for lazy loading */}
      {isModalOpen && modalImages.length > 0 && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        }>
          <ImageModal
            images={modalImages}
            currentIndex={modalImageIndex}
            content={post.content}
            onClose={closeImageModal}
            onNext={goToNextImage}
            onPrev={goToPrevImage}
            onDownload={downloadImage}
            onIndexChange={setModalImageIndex}
          />
        </Suspense>
      )}

      {/* Actions Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">
        <PostActions
          post={post}
          isBookmarked={isBookmarked}
          onLike={onLike}
          onShare={onShare}
          onBookmark={handleBookmark}
          currentUser={currentUser}
          onRepostSuccess={(repost) => {
            // Update repost count optimistically
            if (onPostUpdate) {
              const targetPost = isRepost ? originalPost : post;
              if (targetPost) {
                onPostUpdate({
                  ...post,
                  repostCount: (targetPost.repostCount || 0) + 1
                });
              }
            }
          }}
        />

        {/* Engagement Stats */}
        <EngagementStats
          post={{ ...post, commentCount }} // CẬP NHẬT POST OBJECT
          showComments={showComments}
          onToggleComments={useCallback(() => setShowComments(!showComments), [showComments])}
          currentUserId={currentUserHashId}
          commentCount={commentCount}
        />

        {/* Comment Input */}
        <CommentInput
          postId={post._id}
          onCommentCreated={handleCommentCreated}
          currentUser={currentUser}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          postId={post._id} 
          currentUser={currentUser}   
        />
      )}

    </article>
  );
});

PostCard.displayName = 'PostCard';