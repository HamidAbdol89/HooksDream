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
  placeholder = "Search users, posts, hashtags...",
  className = ""
}) => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search');
  };

  if (variant === 'input') {
    return (
      <div 
        className={`relative flex items-center bg-accent/50 rounded-full px-4 py-2 cursor-pointer hover:bg-accent/70 transition-colors ${className}`}
        onClick={handleSearchClick}
      >
        <Search className="h-4 w-4 text-muted-foreground mr-3" />
        <span className="text-muted-foreground text-sm flex-1">
          {placeholder}
        </span>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSearchClick}
        className={`p-2 ${className}`}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  // Default button variant
  return (
    <Button
      variant="outline"
      onClick={handleSearchClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search</span>
    </Button>
  );
};

export default SearchBar;
