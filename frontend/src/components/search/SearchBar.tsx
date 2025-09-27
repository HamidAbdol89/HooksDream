import React from 'react';
import { Button } from '@/components/ui/Button';
import { Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search');
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSearchClick}
        className={`flex items-center gap-2 hover:bg-accent transition-all duration-200 ${className}`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Tìm kiếm nâng cao</span>
        <Sparkles className="h-3 w-3 opacity-60 hidden lg:inline" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSearchClick}
        className={`p-2 hover:bg-accent transition-colors ${className}`}
        aria-label="Tìm kiếm nâng cao"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  // Input variant - fake input that navigates to search
  return (
    <div className={`max-w-md ${className}`}>
      <div 
        onClick={handleSearchClick}
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
    </div>
  );
};

export default SearchBar;
