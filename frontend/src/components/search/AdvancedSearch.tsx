import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from './SearchInput';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { SearchSuggestions } from './SearchSuggestions';
import { TrendingHashtags } from './TrendingHashtags';
import { searchApi } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Search, Filter, TrendingUp, Clock } from 'lucide-react';

interface AdvancedSearchProps {
  className?: string;
  defaultTab?: 'all' | 'users' | 'posts';
  onClose?: () => void; // Callback để đóng search modal/page
}

interface SearchFiltersType {
  sort: 'relevance' | 'latest' | 'popular';
  dateFrom?: string;
  dateTo?: string;
  hasMedia?: boolean;
  hashtag?: string;
}

interface SearchState {
  query: string;
  activeTab: 'all' | 'users' | 'posts';
  filters: SearchFiltersType;
  results: any;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  className = "",
  defaultTab = 'all',
  onClose
}) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    activeTab: defaultTab,
    filters: {
      sort: 'relevance'
    },
    results: null,
    loading: false,
    error: null,
    hasSearched: false
  });

  const [showFilters, setShowFilters] = useState(false);

  // Perform search
  const performSearch = useCallback(async (query: string, tab: string, filters: SearchFiltersType) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: null,
        hasSearched: false,
        error: null
      }));
      return;
    }

    setSearchState(prev => ({ ...prev, loading: true, error: null, hasSearched: true }));

    try {
      let response;
      
      if (tab === 'posts') {
        response = await searchApi.searchPosts({
          q: query.trim(),
          sort: filters.sort,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          hasMedia: filters.hasMedia,
          hashtag: filters.hashtag,
          limit: 20
        });
      } else {
        response = await searchApi.unifiedSearch({
          q: query.trim(),
          type: tab as 'all' | 'users' | 'posts',
          sort: filters.sort,
          limit: 20
        });
      }

      if (response.success) {
        setSearchState(prev => ({ ...prev, results: response.data, loading: false }));
      } else {
        setSearchState(prev => ({ 
          ...prev, 
          error: response.message || 'Có lỗi xảy ra khi tìm kiếm',
          loading: false 
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tìm kiếm',
        loading: false 
      }));
    }
  }, []);

  // Handle search input change
  const handleSearch = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
    performSearch(query, searchState.activeTab, searchState.filters);
  }, [searchState.activeTab, searchState.filters, performSearch]);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    const newTab = tab as 'all' | 'users' | 'posts';
    setSearchState(prev => ({ ...prev, activeTab: newTab }));
    if (searchState.query) {
      performSearch(searchState.query, newTab, searchState.filters);
    }
  }, [searchState.query, searchState.filters, performSearch]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: SearchFiltersType) => {
    setSearchState(prev => ({ ...prev, filters: newFilters }));
    if (searchState.query) {
      performSearch(searchState.query, searchState.activeTab, newFilters);
    }
  }, [searchState.query, searchState.activeTab, performSearch]);

  // Memoized empty state
  const emptyState = useMemo(() => {
    if (!searchState.hasSearched) {
      return (
        <div className="space-y-6">
          <SearchSuggestions onSuggestionClick={handleSearch} />
          <TrendingHashtags onHashtagClick={(hashtag: string) => handleSearch(`#${hashtag}`)} />
        </div>
      );
    }
    return null;
  }, [searchState.hasSearched, handleSearch]);

  const isMobile = className?.includes('mobile-optimized');
  const isModal = className?.includes('modal-optimized');

  return (
    <div className={`w-full ${className}`}>
      {/* Search Header - ẩn trong mobile và modal để tiết kiệm không gian */}
      {!isMobile && !isModal && (
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Tìm kiếm nâng cao
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput
                onSearch={handleSearch}
                placeholder="Tìm kiếm người dùng, bài viết, hashtags..."
                className="w-full"
                debounceMs={300}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-accent'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Bộ lọc</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <SearchFilters
              filters={searchState.filters}
              onFiltersChange={handleFiltersChange}
              activeTab={searchState.activeTab}
            />
          )}
        </CardContent>
        </Card>
      )}

      {/* Compact Search Input cho mobile/modal */}
      {(isMobile || isModal) && (
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchInput
                onSearch={handleSearch}
                placeholder="Tìm kiếm người dùng, bài viết, hashtags..."
                className="w-full"
                debounceMs={300}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-accent'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Compact Filters */}
          {showFilters && (
            <div className="mt-3">
              <SearchFilters
                filters={searchState.filters}
                onFiltersChange={handleFiltersChange}
                activeTab={searchState.activeTab}
              />
            </div>
          )}
        </div>
      )}

      {/* Search Tabs */}
      <Tabs value={searchState.activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Bài viết
          </TabsTrigger>
        </TabsList>

        {/* Loading State */}
        {searchState.loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">Đang tìm kiếm...</span>
          </div>
        )}

        {/* Error State */}
        {searchState.error && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">❌ Có lỗi xảy ra</div>
            <div className="text-muted-foreground">{searchState.error}</div>
          </div>
        )}

        {/* Empty State */}
        {!searchState.loading && !searchState.error && !searchState.hasSearched && emptyState}

        {/* Search Results */}
        {!searchState.loading && !searchState.error && searchState.hasSearched && (
          <>
            <TabsContent value="all">
              <SearchResults
                results={searchState.results}
                type="all"
                query={searchState.query}
                onClose={onClose}
              />
            </TabsContent>

            <TabsContent value="users">
              <SearchResults
                results={searchState.results}
                type="users"
                query={searchState.query}
                onClose={onClose}
              />
            </TabsContent>

            <TabsContent value="posts">
              <SearchResults
                results={searchState.results}
                type="posts"
                query={searchState.query}
                onClose={onClose}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default AdvancedSearch;
