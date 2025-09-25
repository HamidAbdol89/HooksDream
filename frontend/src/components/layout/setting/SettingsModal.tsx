import React, { useState } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { ChevronRight, Globe, X, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSettings } from './LanguageSettings';
import { ThemeSettings } from './ThemeSettings';

interface SettingsModalProps {
  isOpen: boolean;
  currentView: 'main' | 'language' | 'theme';
  onChangeView: (view: 'main' | 'language' | 'theme') => void;
  onClose: () => void;
}
const viewVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

const transition: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

export const SettingsModal = ({
  isOpen,
  currentView,
  onChangeView,
  onClose,
}: SettingsModalProps) => {
  const { t } = useTranslation('common');
  const [direction, setDirection] = useState(1);
  const isDark = document.documentElement.classList.contains("dark");

  const handleChangeView = (newView: 'main' | 'language' | 'theme') => {
    setDirection(newView === 'main' ? -1 : 1);
    onChangeView(newView);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50"
    >
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        {/* Header - Only close button */}
        <div className="flex items-center justify-end p-4 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-neutral-50 dark:bg-neutral-900 z-20">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 -mr-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Content with animation */}
        <div className="p-4 relative overflow-hidden h-[calc(100vh-56px)]">
          <AnimatePresence custom={direction} initial={false}>
            {currentView === 'main' ? (
              <motion.div
                key="main-view"
                custom={direction}
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 p-4 space-y-2"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChangeView('language')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    <span className="font-medium">{t('settings.language')}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChangeView('theme')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {isDark ? (
                      <Moon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    )}
                    <span className="font-medium">{t('settings.theme')}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                </motion.button>
              </motion.div>
            ) : currentView === 'language' ? (
              <motion.div
                key="language-view"
                custom={direction}
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 p-4"
              >
                <LanguageSettings onBack={() => handleChangeView('main')} />
              </motion.div>
            ) : (
              <motion.div
                key="theme-view"
                custom={direction}
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0 p-4"
              >
                <ThemeSettings onBack={() => handleChangeView('main')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};