import React, { useState } from 'react';
import { SearchInput } from './SearchInput';
import { SearchModal } from './SearchModal';
import { Button } from '@/components/ui/Button';
import { Search, Sparkles } from 'lucide-react';

interface SearchBarProps {
  variant?: 'input' | 'button' | 'compact';
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  variant = 'button',
  placeholder = "Tìm kiếm người dùng, bài viết...",
  className = ""
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 hover:bg-accent transition-all duration-200 ${className}`}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Tìm kiếm nâng cao</span>
          <Sparkles className="h-3 w-3 opacity-60 hidden lg:inline" />
        </Button>

        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Tìm kiếm nâng cao"
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={`p-2 hover:bg-accent transition-colors ${className}`}
          aria-label="Tìm kiếm nâng cao"
        >
          <Search className="h-4 w-4" />
        </Button>

        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Tìm kiếm nâng cao"
        />
      </>
    );
  }

  // Input variant - fake input that opens modal
  return (
    <div className={`max-w-md ${className}`}>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="relative cursor-pointer"
      >
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg border transition-colors">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm flex-1">
            {placeholder}
          </span>
          <Sparkles className="h-3 w-3 text-muted-foreground/60" />
        </div>
      </div>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tìm kiếm nâng cao"
      />
    </div>
  );
};

export default SearchBar;
