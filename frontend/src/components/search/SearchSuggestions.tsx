import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { searchApi } from '@/services/api';
import { Clock, Search, Hash, Users } from 'lucide-react';

interface SearchSuggestionsProps {
  onSuggestionClick: (query: string) => void;
  query?: string;
}

interface Suggestion {
  users: Array<{
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  }>;
  hashtags: Array<{
    tag: string;
    count: number;
  }>;
  recent: string[];
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  onSuggestionClick,
  query = ''
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion>({
    users: [],
    hashtags: [],
    recent: []
  });
  const [loading, setLoading] = useState(false);

  // Get recent searches from localStorage
  const getRecentSearches = (): string[] => {
    try {
      const recent = localStorage.getItem('recent_searches');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  };

  // Save search to recent
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    try {
      const recent = getRecentSearches();
      const updated = [searchQuery, ...recent.filter(q => q !== searchQuery)].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Fetch suggestions from API
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions({
        users: [],
        hashtags: [],
        recent: getRecentSearches()
      });
      return;
    }

    setLoading(true);
    try {
      const response = await searchApi.getSearchSuggestions({
        q: searchQuery,
        limit: 5
      });

      if (response.success) {
        setSuggestions({
          ...response.data,
          recent: getRecentSearches()
        });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    saveRecentSearch(suggestion);
    onSuggestionClick(suggestion);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    localStorage.removeItem('recent_searches');
    setSuggestions(prev => ({ ...prev, recent: [] }));
  };

  useEffect(() => {
    if (query) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions({
        users: [],
        hashtags: [],
        recent: getRecentSearches()
      });
    }
  }, [query]);

  const hasAnySuggestions = suggestions.users.length > 0 || 
                           suggestions.hashtags.length > 0 || 
                           suggestions.recent.length > 0;

  if (!hasAnySuggestions && !loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Bắt đầu nhập để xem gợi ý tìm kiếm</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recent Searches */}
      {suggestions.recent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tìm kiếm gần đây
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {suggestions.recent.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(search)}
                  className="text-xs"
                >
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Suggestions */}
      {suggestions.users.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Người dùng
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {suggestions.users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSuggestionClick(user.username)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="text-xs">
                      {user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hashtag Suggestions */}
      {suggestions.hashtags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Hashtags phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {suggestions.hashtags.map((hashtag, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(`#${hashtag.tag}`)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">#{hashtag.tag}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {hashtag.count} bài viết
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchSuggestions;
