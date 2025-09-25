// src/components/posts/PostCard.tsx
import React, { useState, useEffect } from 'react';
import { PostHeader } from '@/components/posts/PostHeader';
import { PostContent } from '@/components/posts/PostContent';
import { PostMedia } from '@/components/posts/PostMedia';
import { PostActions } from '@/components/posts/PostActions';
import { EngagementStats } from '@/components/posts/EngagementStats';
import { CommentInput } from '@/components/comment/CommentInput';
import { CommentSection } from '@/components/comment/CommentSection';
import { ImageModal } from './ImageModal';
import { usePostInteractions } from '@/components/posts/hooks/usePostInteractions';
import { useImageModal } from '@/components/posts/hooks/useImageModal';
import { Post } from '@/types/post';
import { PostLikesDialog } from './PostLikesDialog';
import { UserProfile } from '@/types/user';
import { api } from '@/services/api'; // THÊM IMPORT
import { useToast } from '@/components/ui/use-toast'; // THÊM IMPORT
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

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

export const PostCard: React.FC<PostCardProps> = ({ 
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
  const { toast } = useToast(); // THÊM TOAST
  const {
    isExpanded,
    setIsExpanded,
    showComments,
    setShowComments,
    isBookmarked,
    handleBookmark,
    handleUserClick
  } = usePostInteractions(post, onBookmark);

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


  const handleShowLikes = () => {
    if (post.likeCount > 0) {
      setShowLikesDialog(true);
    }
  };

const handleCommentCreated = () => {
  // Optimistic update: Tăng comment count ngay lập tức
  if (onPostUpdate) {
    onPostUpdate({
      ...post,
      commentCount: (post.commentCount || 0) + 1
    });
  }
    // Đồng bộ với server sau (không cần chờ)
  setTimeout(async () => {
    try {
      const response = await api.post.getPost(post._id);
      if (response.success && response.data) {
        onPostUpdate?.(response.data);
      }
    } catch (error) {
      console.error('Error syncing comment count:', error);
    }
  }, 1000);
};

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

  return (
    <article className="bg-background/95 backdrop-blur-sm border-0 border-b border-border/50 hover:bg-background/98 transition-all duration-300 group">
      <PostHeader
        user={post.userId}
        createdAt={post.createdAt}
        onFollow={onFollow}
        isFollowLoading={isFollowLoading}
        onUserClick={handleUserClick}
        isOwnProfile={isOwnProfile}
      />

      {/* Content */}
      <PostContent
        content={post.content}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {/* Media */}
      <PostMedia
        images={post.images}
        video={post.video}
        content={post.content}
        onImageClick={openImageModal}
      />

      {/* Image Modal */}
      {isModalOpen && modalImages.length > 0 && (
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
      )}

      {/* Actions Bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">
        <PostActions
          post={post}
          isBookmarked={isBookmarked}
          onLike={onLike}
        
          onShare={onShare}
          onBookmark={handleBookmark}
           currentUser={currentUser} // Thêm prop này

          
        />

        {/* Engagement Stats */}
        <EngagementStats
          post={{ ...post, commentCount }} // CẬP NHẬT POST OBJECT
          showComments={showComments}
          onToggleComments={() => setShowComments(!showComments)}
          onShowLikes={handleShowLikes}
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

      {/* Likes Dialog */}
      <PostLikesDialog
        postId={post._id}
        open={showLikesDialog}
        onOpenChange={setShowLikesDialog}
        currentUserId={currentUserHashId} 
      />
    </article>
  );
};