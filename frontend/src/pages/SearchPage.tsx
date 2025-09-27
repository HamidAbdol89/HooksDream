import React from 'react';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { Search } from 'lucide-react';

export const SearchPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Tìm kiếm nâng cao</h1>
        </div>
        <p className="text-muted-foreground">
          Tìm kiếm người dùng, bài viết và khám phá nội dung thịnh hành
        </p>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        defaultTab="all"
      />
    </div>
  );
};

export default SearchPage;
