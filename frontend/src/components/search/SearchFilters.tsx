import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Image, Video, Hash, RotateCcw } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    sort: 'relevance' | 'latest' | 'popular' | 'engagement';
    dateFrom?: string;
    dateTo?: string;
    hasMedia?: boolean;
    hashtag?: string;
  };
  onFiltersChange: (filters: any) => void;
  activeTab: 'all' | 'users' | 'posts';
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  activeTab
}) => {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      sort: 'relevance'
    });
  };

  const getSortOptions = () => {
    const baseOptions = [
      { value: 'relevance', label: 'Liên quan nhất' },
      { value: 'latest', label: 'Mới nhất' }
    ];

    if (activeTab === 'posts' || activeTab === 'all') {
      baseOptions.push(
        { value: 'popular', label: 'Phổ biến nhất' },
        { value: 'engagement', label: 'Tương tác cao nhất' }
      );
    }

    if (activeTab === 'users') {
      baseOptions.push(
        { value: 'popular', label: 'Nhiều follower nhất' }
      );
    }

    return baseOptions;
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Bộ lọc tìm kiếm
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Đặt lại
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sort */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sắp xếp theo</Label>
          <Select
            value={filters.sort}
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn cách sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {getSortOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        {(activeTab === 'posts' || activeTab === 'all') && (
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Từ ngày</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Date To */}
        {(activeTab === 'posts' || activeTab === 'all') && (
          <div className="space-y-2">
            <Label htmlFor="dateTo">Đến ngày</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Hashtag */}
        {(activeTab === 'posts' || activeTab === 'all') && (
          <div className="space-y-2">
            <Label htmlFor="hashtag" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Hashtag
            </Label>
            <Input
              id="hashtag"
              type="text"
              placeholder="Nhập hashtag..."
              value={filters.hashtag || ''}
              onChange={(e) => handleFilterChange('hashtag', e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Media Filter */}
      {(activeTab === 'posts' || activeTab === 'all') && (
        <div className="space-y-3">
          <Label>Loại nội dung</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasMedia"
                checked={filters.hasMedia === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('hasMedia', checked ? true : undefined)
                }
              />
              <Label htmlFor="hasMedia" className="flex items-center gap-1 cursor-pointer">
                <Image className="h-4 w-4" />
                Có hình ảnh/video
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="noMedia"
                checked={filters.hasMedia === false}
                onCheckedChange={(checked) => 
                  handleFilterChange('hasMedia', checked ? false : undefined)
                }
              />
              <Label htmlFor="noMedia" className="cursor-pointer">
                Chỉ văn bản
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filters.dateFrom || filters.dateTo || filters.hashtag || filters.hasMedia !== undefined) && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Bộ lọc đang áp dụng:</span>
            
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Từ: {new Date(filters.dateFrom).toLocaleDateString('vi-VN')}
                <button
                  onClick={() => handleFilterChange('dateFrom', undefined)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Đến: {new Date(filters.dateTo).toLocaleDateString('vi-VN')}
                <button
                  onClick={() => handleFilterChange('dateTo', undefined)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.hashtag && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                #{filters.hashtag}
                <button
                  onClick={() => handleFilterChange('hashtag', undefined)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.hasMedia === true && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                <Image className="h-3 w-3" />
                Có media
                <button
                  onClick={() => handleFilterChange('hasMedia', undefined)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}

            {filters.hasMedia === false && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Chỉ văn bản
                <button
                  onClick={() => handleFilterChange('hasMedia', undefined)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
