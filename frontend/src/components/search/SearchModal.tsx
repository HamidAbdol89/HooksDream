import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Search } from 'lucide-react';
import { SearchUsers } from './SearchUsers';
import { Profile } from '@/store/useAppStore';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  title = "Tìm kiếm người dùng"
}) => {
  const navigate = useNavigate();

  const handleUserSelect = (user: Profile) => {
    // Navigate to user profile
    const userId = user._id || user.id;
    navigate(`/profile/${userId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <SearchUsers
            onUserSelect={handleUserSelect}
            showFollowButton={true}
            className="px-1"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Search Button Component để trigger modal
interface SearchButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg";
}

export const SearchButton: React.FC<SearchButtonProps> = ({
  className = "",
  variant = "outline",
  size = "sm"
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsSearchOpen(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Tìm kiếm</span>
      </Button>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default SearchModal;
