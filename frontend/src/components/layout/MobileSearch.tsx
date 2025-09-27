// src/components/layout/MobileSearch.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { Profile } from '@/store/useAppStore';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const MobileSearch = ({ isOpen, onClose, searchInputRef }: MobileSearchProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // SearchResults sẽ tự handle navigation, chỉ cần close modal
  const handleSearchAction = () => {
    // Modal sẽ tự close khi user navigate
    setTimeout(() => {
      onClose();
    }, 100);
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
              <h2 className="text-lg font-semibold">Tìm kiếm nâng cao</h2>
              <div className="w-10"></div> {/* Placeholder for alignment */}
            </div>

            {/* Advanced Search Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <AdvancedSearch
                defaultTab="all"
                className="mobile-optimized"
                onClose={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};