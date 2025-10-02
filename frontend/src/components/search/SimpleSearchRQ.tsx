import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  useSearchQuery, 
  useTrendingHashtags, 
  useSearchHistory, 
  useSearchHistoryMutations,
  useDebouncedSearch 
} from '@/hooks/useSearchQuery';

interface SearchResult {
  _id: string;
  _type: 'user' | 'post';
  objectID: string;
  content?: string;
  userId?: {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified?: boolean;
  };
  username?: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
  likeCount?: number;
  commentCount?: number;
  repostCount?: number;
  images?: string[];
  hashtags?: string[];
  createdAt?: string;
  type?: string;
  visibility?: string;
}

export const SimpleSearchRQ: React.FC = () => {
  const [query, setQuery] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const navigate = useNavigate();

  // Debounced search query
  const debouncedQuery = useDebouncedSearch(query, 500);
  
  // React Query hooks
  const { data: results = [], isLoading, error } = useSearchQuery(debouncedQuery);
  const { data: trendingHashtags = [] } = useTrendingHashtags();
  const { data: searchHistory = [] } = useSearchHistory();
  const { deleteHistoryItem, clearAllHistory } = useSearchHistoryMutations();

  // Derived state
  const hasSearched = debouncedQuery.trim().length > 0;

  // Event handlers
  const handleUserClick = (user: SearchResult) => {
    navigate(`/profile/${user._id}`);
  };

  const handlePostClick = (post: SearchResult) => {
    navigate(`/post/${post._id}`);
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const handleHashtagClick = (hashtag: string) => {
    setQuery(`#${hashtag}`);
  };

  const handleDeleteHistoryItem = async (historyQuery: string) => {
    try {
      await deleteHistoryItem.mutateAsync(historyQuery);
    } catch (error) {
      // Silently fail
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await clearAllHistory.mutateAsync();
      setShowClearDialog(false);
    } catch (error) {
      // Silently fail
    }
  };

  const handleClearAllClick = () => {
    setShowClearDialog(true);
  };

  const clearSearch = () => {
    setQuery('');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search users, posts, hashtags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Results */}
        {!isLoading && hasSearched && (
          <div className="space-y-4">
            {results.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {results.length} results found for "{debouncedQuery}"
                </p>
                
                {results.map((result) => (
                  <Card key={result.objectID} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      {result._type === 'user' ? (
                        <div 
                          className="flex items-center gap-3"
                          onClick={() => handleUserClick(result)}
                        >
                          <img 
                            src={result.avatar || '/default-avatar.png'} 
                            alt={result.displayName}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{result.displayName}</h3>
                              {result.isVerified && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">@{result.username}</p>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="space-y-3"
                          onClick={() => handlePostClick(result)}
                        >
                          <div className="flex items-center gap-3">
                            <img 
                              src={result.userId?.avatar || '/default-avatar.png'} 
                              alt={result.userId?.displayName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{result.userId?.displayName}</span>
                              {result.userId?.isVerified && (
                                <Badge variant="secondary" className="text-xs">✓</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">@{result.userId?.username}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm leading-relaxed">{result.content}</p>
                          
                          {result.hashtags && result.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {result.hashtags.slice(0, 3).map((hashtag) => (
                                <Badge key={hashtag} variant="outline" className="text-xs">
                                  #{hashtag}
                                </Badge>
                              ))}
                              {result.hashtags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{result.hashtags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Post Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{result.likeCount || 0} likes</span>
                            <span>{result.commentCount || 0} comments</span>
                            <span>{result.repostCount || 0} reposts</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found for "{debouncedQuery}"</h3>
                <p className="text-muted-foreground">Try searching for something else</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State - Clean */}
        {!hasSearched && !isLoading && (
          <div className="space-y-6">

            
            {/* Search History - Moved to top */}
            {searchHistory.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Recent Searches</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllClick}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {searchHistory.map((item) => (
                      <div key={item.query} className="space-y-2">
                        {/* Direct Results - No query text needed */}
                        {item.topResults && (
                          <div className="space-y-2">
                            {/* Top Users - Direct access */}
                            {item.topResults.users.slice(0, 2).map((user) => (
                              <div
                                key={user._id}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer group"
                                onClick={() => navigate(`/profile/${user._id}`)}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                  <img 
                                    src={user.avatar || '/default-avatar.png'} 
                                    alt={user.displayName}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <div className="font-medium text-sm truncate max-w-full">{user.displayName}</div>
                                    <div className="text-muted-foreground text-xs truncate max-w-full">@{user.username}</div>
                                  </div>
                                  {user.isVerified && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0 flex-shrink-0">✓</Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHistoryItem(item.query);
                                  }}
                                  className="opacity-50 hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            
                            {/* Top Posts - Direct access */}
                            {item.topResults.posts.slice(0, 1).map((post) => (
                              <div
                                key={post._id}
                                className="flex items-start justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
                                onClick={() => navigate(`/post/${post._id}`)}
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                                  <img 
                                    src={post.userId.avatar || '/default-avatar.png'} 
                                    alt={post.userId.displayName}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 overflow-hidden">
                                    <div className="font-medium text-sm truncate max-w-full">{post.userId.displayName}</div>
                                    <div className="text-muted-foreground text-xs truncate max-w-full">{post.content}</div>
                                    {((post.likeCount ?? 0) > 0 || (post.commentCount ?? 0) > 0 || (post.repostCount ?? 0) > 0) && (
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        {(post.likeCount ?? 0) > 0 && <span>{post.likeCount ?? 0} likes</span>}
                                        {(post.commentCount ?? 0) > 0 && <span>{post.commentCount ?? 0} comments</span>}
                                        {(post.repostCount ?? 0) > 0 && <span>{post.repostCount ?? 0} reposts</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHistoryItem(item.query);
                                  }}
                                  className="opacity-50 hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}

                            {/* Fallback: Show query if no results */}
                            {(!item.topResults.users.length && !item.topResults.posts.length) && (
                              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent group">
                                <div 
                                  className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                  onClick={() => handleHistoryClick(item.query)}
                                >
                                  <span className="text-sm font-medium truncate">{item.query}</span>
                                  {item.searchCount > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.searchCount}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteHistoryItem(item.query);
                                  }}
                                  className="opacity-50 hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Trending Hashtags</h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingHashtags.slice(0, 8).map((hashtag) => (
                      <Badge
                        key={hashtag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleHashtagClick(hashtag)}
                      >
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Search History</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all search history? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleClearAllHistory}
            >
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleSearchRQ;
