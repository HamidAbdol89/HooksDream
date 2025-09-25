import React from 'react';
import { Grid3X3, List, User, Plus, Play, Image as ImageIconLucide } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PostCard } from './PostCard';
import { Post, Profile } from '@/store/useAppStore';
import { GridPostCard } from "./GridPostCard";

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  posts: Post[];
  mediaPosts: Post[];
  likedPosts: Post[];
  postsLoading: boolean;
  isOwnProfile: boolean;
  user: Profile;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  hasMorePosts: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement>;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  posts,
  mediaPosts,
  likedPosts,
  postsLoading,
  isOwnProfile,
  user,
  onLike,
  onDelete,
  onComment,
  onShare,
  hasMorePosts,
  loadMoreRef
}) => {
  const filteredPosts = {
    posts,
    media: mediaPosts,
    likes: likedPosts
  };

  const EmptyState = ({ type }: { type: string }) => {
    const config = {
      posts: {
        icon: User,
        title: 'No posts yet',
        description: isOwnProfile 
          ? 'Start sharing your thoughts, photos and videos!' 
          : `@${user.username} hasn't posted anything yet.`,
        showButton: isOwnProfile
      },
      media: {
        icon: ImageIconLucide,
        title: 'No media',
        description: isOwnProfile
          ? 'Share photos and videos to see them here!'
          : `@${user.username} hasn't shared any media yet.`,
        showButton: false
      },
      likes: {
        icon: User,
        title: 'No liked posts',
        description: isOwnProfile
          ? 'Like posts to see them here!'
          : `@${user.username} hasn't liked any posts yet.`,
        showButton: false
      }
    };

    const { icon: Icon, title, description, showButton } = config[type as keyof typeof config];

    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
          {title}
        </h3>
        
        <p className="text-sm sm:text-base text-muted-foreground max-w-md leading-relaxed mb-4 sm:mb-6">
          {description}
        </p>
        
        {showButton && (
          <Button className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        )}
      </div>
    );
  };

  const renderLoadingSpinner = () => (
    <div className="flex justify-center py-8 sm:py-12">
      <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const renderNoMorePosts = () => (
    <div className="text-center py-6 sm:py-8">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2 sm:mb-3">
        <User className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-xs sm:text-sm">
        You've reached the end of {activeTab}
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-none">
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
        {/* Sticky Navigation Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-3">
            {/* Tab Navigation */}
            <TabsList className="bg-muted/50 rounded-full p-1 h-auto flex-1 max-w-md">
              <TabsTrigger 
                value="posts" 
                className="rounded-full px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm flex-1 min-w-0"
              >
                <span className="flex items-center gap-1 min-w-0">
                  <span className="truncate">Posts</span>
                  <Badge variant="secondary" className="h-4 text-xs px-1 sm:px-2 flex-shrink-0">
                    {posts.length}
                  </Badge>
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="media" 
                className="rounded-full px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm flex-1 min-w-0"
              >
                <span className="flex items-center gap-1 min-w-0">
                  <span className="truncate">Media</span>
                  <Badge variant="secondary" className="h-4 text-xs px-1 sm:px-2 flex-shrink-0">
                    {mediaPosts.length}
                  </Badge>
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="likes" 
                className="rounded-full px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm flex-1 min-w-0"
              >
                <span className="flex items-center gap-1 min-w-0">
                  <span className="truncate">Likes</span>
                  <Badge variant="secondary" className="h-4 text-xs px-1 sm:px-2 flex-shrink-0">
                    {likedPosts.length}
                  </Badge>
                </span>
              </TabsTrigger>
            </TabsList>

            {/* View Mode Toggle - Only for Posts Tab */}
            {activeTab === 'posts' && posts.length > 0 && (
              <div className="flex items-center bg-muted/50 rounded-full p-1">
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-3 sm:px-6 py-4 sm:py-6">
          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-0 space-y-0">
            {filteredPosts.posts.length === 0 && !postsLoading ? (
              <EmptyState type="posts" />
            ) : (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
                    : 'space-y-0'
                }>
                  {filteredPosts.posts.map((post) => (
                    viewMode === 'grid' ? (
                      <GridPostCard 
                        key={post._id} 
                        post={post} 
                        isOwnProfile={isOwnProfile} 
                        onLike={onLike} 
                        onDelete={onDelete} 
                      />
                    ) : (
                     // Sửa phần render PostCard
<PostCard 
  key={post._id} 
  post={post} 
  author={user} // Đảm bảo user có type Profile
  isOwnProfile={isOwnProfile} 
  onLike={onLike} 
  onDelete={onDelete}
  onComment={onComment}
  onShare={onShare}
/>
                    )
                  ))}
                </div>
                
                {postsLoading && renderLoadingSpinner()}
                {hasMorePosts && !postsLoading && <div ref={loadMoreRef} className="h-2" />}
                {!hasMorePosts && filteredPosts.posts.length > 0 && renderNoMorePosts()}
              </>
            )}
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-0">
            {filteredPosts.media.length === 0 && !postsLoading ? (
              <EmptyState type="media" />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {filteredPosts.media.map((post) => (
                    <React.Fragment key={post._id}>
                      {/* Images */}
                      {post.images?.map((image: string, index: number) => (
                        <Dialog key={`${post._id}-image-${index}`}>
                          <DialogTrigger asChild>
                            <div className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-muted">
                              <img
                                src={image}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                              
                              {/* Multi-image indicator */}
                              {post.images && post.images.length > 1 && index === 0 && (
                                <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/70 text-white border-0 text-xs">
                                  <ImageIconLucide className="mr-1 h-3 w-3" />
                                  {post.images.length}
                                </Badge>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur">
                            <img src={image} alt="" className="w-full h-auto rounded-lg" />
                          </DialogContent>
                        </Dialog>
                      ))}
                      
                      {/* Videos */}
                      {post.video && (
                        <Dialog key={`${post._id}-video`}>
                          <DialogTrigger asChild>
                            <div className="relative group cursor-pointer aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-black">
                              <video
                                className="w-full h-full object-cover"
                                muted
                              >
                                <source src={post.video} type="video/mp4" />
                              </video>
                              
                              {/* Play Button Overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-black ml-0.5" fill="currentColor" />
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur">
                            <video controls className="w-full h-auto rounded-lg">
                              <source src={post.video} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </DialogContent>
                        </Dialog>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                
                {postsLoading && renderLoadingSpinner()}
                {hasMorePosts && !postsLoading && <div ref={loadMoreRef} className="h-2" />}
                {!hasMorePosts && filteredPosts.media.length > 0 && renderNoMorePosts()}
              </>
            )}
          </TabsContent>

          {/* Likes Tab */}
          <TabsContent value="likes" className="mt-0">
            {filteredPosts.likes.length === 0 && !postsLoading ? (
              <EmptyState type="likes" />
            ) : (
              <>
                <div className="space-y-0">
                  {filteredPosts.likes.map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      author={user}
                      isOwnProfile={isOwnProfile} 
                      onLike={onLike} 
                      onDelete={onDelete}
                      onComment={onComment}
                      onShare={onShare}
                    />
                  ))}
                </div>
                
                {postsLoading && renderLoadingSpinner()}
                {hasMorePosts && !postsLoading && <div ref={loadMoreRef} className="h-2" />}
                {!hasMorePosts && filteredPosts.likes.length > 0 && renderNoMorePosts()}
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};