import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, Moon, Sun } from "lucide-react";
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';

interface ThemeSettingsProps {
  onBack: () => void;
}

export const ThemeSettings = ({ onBack }: ThemeSettingsProps) => {
  const { t } = useTranslation("common");
  const { toggleTheme, getCurrentTheme } = useSettings();
  const currentTheme = getCurrentTheme();

  const themes = [
    { id: "light", name: t("settings.theme.light"), icon: <Sun className="w-5 h-5" /> },
    { id: "dark", name: t("settings.theme.dark"), icon: <Moon className="w-5 h-5" /> },
  ];

  const changeTheme = (theme: string) => {
    if (theme !== currentTheme) {
      toggleTheme(); // Sử dụng hàm từ hook thay vì tự xử lý
    }
  };

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-4"
    >
      {/* Header with back button */}
      <div className="flex items-center space-x-4 p-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-medium">{t("settings.theme")}</h3>
      </div>

      {/* Theme list */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => changeTheme(theme.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {theme.icon}
              <span>{theme.name}</span>
            </div>
            {currentTheme === theme.id && (
              <Check className="w-5 h-5 text-blue-500" />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};