// ArchivedStoriesModal.tsx - Modal for viewing archived stories
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Play, 
  Image as ImageIcon, 
  Mic, 
  Type,
  Clock,
  Eye,
  Heart,
  X
} from 'lucide-react';
import { useArchivedStories } from '@/hooks/useArchivedStories';
import { useAppStore } from '@/store/useAppStore';
import { StoryViewer } from '@/components/story/StoryViewer';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface ArchivedStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchivedStoriesModal: React.FC<ArchivedStoriesModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, profile } = useAppStore();
  
  const userId = useMemo(() => 
    user?.id || user?._id || profile?.id,
    [user?.id, user?._id, profile?.id]
  );

  const {
    archivedStories,
    isLoading,
    selectedStoryIndex,
    selectedStory,
    openStoryViewer,
    closeStoryViewer,
    navigateStory,
    restoreStory,
    deleteStoryPermanently,
    isRestoring,
    isDeleting
  } = useArchivedStories(userId);

  // Reply handler for archived stories
  const handleReply = async (storyId: string, message: string, media?: File) => {
    try {
      // Use same API as active stories
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) throw new Error('No authentication token');

      const formData = new FormData();
      formData.append('message', message);
      if (media) {
        formData.append('media', media);
      }

      const response = await fetch(`/api/stories/${storyId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      // Show success toast
      toast.success('Phản hồi đã được gửi', {
        description: 'Tin nhắn đã được gửi đến tác giả story',
        duration: 4000,
      });
    } catch (error) {
      console.error('Reply error:', error);
      
      // Show error toast
      toast.error('Không thể gửi phản hồi', {
        description: 'Vui lòng thử lại sau',
        duration: 4000,
      });
    }
  };

  // Reaction handler for archived stories
  const handleReaction = async (storyId: string, reactionType: string, position?: { x: number; y: number }) => {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) throw new Error('No authentication token');

      const response = await fetch(`/api/stories/${storyId}/reaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reactionType,
          position: position || { x: 50, y: 50 }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      // Show success toast
      toast.success('Đã thêm reaction', {
        description: `Reaction ${reactionType} đã được gửi`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Reaction error:', error);
      
      // Show error toast
      toast.error('Không thể thêm reaction', {
        description: 'Vui lòng thử lại sau',
        duration: 4000,
      });
    }
  };

  // Get media type icon
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      default: return <ImageIcon className="w-4 h-4" />;
    }
  };

  // Get visibility badge color
  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'followers': return 'bg-blue-100 text-blue-800';
      case 'close_friends': return 'bg-purple-100 text-purple-800';
      case 'private': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle story actions
  const handleRestore = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreStory(storyId);
      
      // Show success toast
      toast.success('Story đã được khôi phục', {
        description: 'Story đã hiển thị trở lại trên trang Stories',
        duration: 4000,
      });
    } catch (error) {
      console.error('Restore error:', error);
      
      // Show user-friendly error for expired stories
      if (error instanceof Error && error.message?.includes('expired')) {
        toast.error('Không thể khôi phục story', {
          description: 'Story này đã hết hạn 24 giờ và chỉ có thể xem trong lưu trữ',
          duration: 5000,
        });
      } else {
        toast.error('Không thể khôi phục story', {
          description: 'Vui lòng thử lại sau',
          duration: 4000,
        });
      }
    }
  };

  const handleDelete = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn story này?')) {
      try {
        await deleteStoryPermanently(storyId);
        
        // Show success toast
        toast.success('Story đã được xóa vĩnh viễn', {
          description: 'Story không thể khôi phục lại được',
          duration: 4000,
        });
      } catch (error) {
        console.error('Delete error:', error);
        
        // Show error toast
        toast.error('Không thể xóa story', {
          description: 'Vui lòng thử lại sau',
          duration: 4000,
        });
      }
    }
  };

  // Convert archived stories to StoryViewer format
  const viewerStories = useMemo(() => {
    return archivedStories.map((story: any) => ({
      _id: story._id,
      userId: {
        _id: story.userId,
        username: profile?.username || 'user',
        displayName: profile?.displayName || 'User',
        avatar: profile?.avatar || '',
        isVerified: false
      },
      media: story.media,
      settings: story.settings,
      createdAt: story.createdAt,
      views: story.views,
      reactions: story.reactions,
      replies: [],
      isOwn: true // Always true for archived stories
    }));
  }, [archivedStories, profile]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <Archive className="w-5 h-5 text-muted-foreground" />
              Lưu trữ Stories
              <Badge variant="secondary" className="ml-2">
                {archivedStories.length}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : archivedStories.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Chưa có story nào được lưu trữ
                </h3>
                <p className="text-muted-foreground">
                  Stories sẽ được tự động lưu trữ sau 24 giờ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedStories.map((story: any, index: number) => (
                  <div
                    key={story._id}
                    className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => openStoryViewer(index)}
                  >
                    {/* Media Preview */}
                    <div className="aspect-[9/16] bg-muted rounded-lg mb-3 relative overflow-hidden">
                      {story.media.type === 'image' && story.media.url && (
                        <img
                          src={story.media.url}
                          alt="Story"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {story.media.type === 'video' && story.media.thumbnail && (
                        <img
                          src={story.media.thumbnail}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {story.media.type === 'text' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4">
                          <p className="text-center text-sm font-medium line-clamp-6">
                            {story.media.content}
                          </p>
                        </div>
                      )}
                      {story.media.type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                          <Mic className="w-8 h-8" />
                        </div>
                      )}

                      {/* Media Type Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0">
                          {getMediaIcon(story.media.type)}
                          <span className="ml-1 capitalize">{story.media.type}</span>
                        </Badge>
                      </div>

                      {/* Play Button for Video */}
                      {story.media.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/50 rounded-full p-3">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Story Info */}
                    <div className="space-y-2">
                      {/* Visibility & Date */}
                      <div className="flex items-center justify-between">
                        <Badge className={getVisibilityColor(story.settings.visibility)}>
                          {story.settings.visibility}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(story.archivedAt), { 
                            addSuffix: true, 
                            locale: vi 
                          })}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {story.views.length}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {story.reactions.length}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Only show restore for manually archived or non-expired stories */}
                        {(story.archiveType === 'manual' || Date.now() < new Date(story.createdAt).getTime() + 24 * 60 * 60 * 1000) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => handleRestore(story._id, e)}
                            disabled={isRestoring}
                            className="flex-1"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Khôi phục
                          </Button>
                        ) : (
                          <div className="flex-1 text-xs text-muted-foreground flex items-center justify-center py-2">
                            Đã hết hạn
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleDelete(story._id, e)}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Story Viewer */}
      {selectedStoryIndex !== null && selectedStory && (
        <StoryViewer
          stories={viewerStories as any}
          currentIndex={selectedStoryIndex}
          onClose={closeStoryViewer}
          onNext={() => navigateStory('next')}
          onPrevious={() => navigateStory('previous')}
          onReaction={handleReaction} // ✅ Enable reaction for archived stories
          onReply={handleReply} // ✅ Enable reply for archived stories
          onView={() => {}} // No need to track views for archived stories
        />
      )}
    </>
  );
};
