import React, { useState } from 'react';
import { SearchInput } from './SearchInput';
import { SearchModal } from './SearchModal';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';

interface SearchBarProps {
  variant?: 'input' | 'button' | 'compact';
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  variant = 'input',
  placeholder = "Tìm kiếm người dùng...",
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
          className={`flex items-center gap-2 ${className}`}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Tìm kiếm</span>
        </Button>

        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
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
          className={`p-2 ${className}`}
          aria-label="Tìm kiếm"
        >
          <Search className="h-4 w-4" />
        </Button>

        <SearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // Default input variant
  return (
    <div className={`max-w-md ${className}`}>
      <SearchInput
        onSearch={() => {}} // No-op for display-only input
        placeholder={placeholder}
        className="cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        readOnly={true}
      />

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SearchBar;
