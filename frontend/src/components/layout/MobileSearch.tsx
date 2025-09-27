// src/components/layout/MobileSearch.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SearchUsers } from '@/components/search/SearchUsers';
import { Profile } from '@/store/useAppStore';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const MobileSearch = ({ isOpen, onClose, searchInputRef }: MobileSearchProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const handleUserSelect = (user: Profile) => {
    const userId = user._id || user.id;
    navigate(`/profile/${userId}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
        >
          <motion.div 
            className="min-h-screen bg-background text-foreground"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-accent rounded-lg"
                onClick={onClose}
                aria-label="Close search"
              >
                <X className="w-6 h-6" />
              </motion.button>
              <h2 className="text-lg font-semibold">{t('header.search')}</h2>
              <div className="w-10"></div> {/* Placeholder for alignment */}
            </div>

            {/* Search Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <SearchUsers
                onUserSelect={handleUserSelect}
                showFollowButton={true}
                placeholder={t('header.searchPlaceholder') || "Tìm kiếm người dùng..."}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};