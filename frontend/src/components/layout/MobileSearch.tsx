// src/components/layout/MobileSearch.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const MobileSearch = ({ isOpen, onClose, searchInputRef }: MobileSearchProps) => {
  const { t } = useTranslation('common');

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchInputRef]);

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
            className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            exit={{ y: 50 }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2"
                onClick={onClose}
                aria-label="Close search"
              >
                <X className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
              </motion.button>
              <h2 className="text-lg font-semibold">{t('header.search')}</h2>
              <div className="w-10"></div> {/* Placeholder for alignment */}
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('header.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search input"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Các bước phát triển tiếp theo:
//=== Thêm component SearchResults

//  Triển khai API call khi nhập

// Thêm debounce cho input

//  Lưu lịch sử tìm kiếm