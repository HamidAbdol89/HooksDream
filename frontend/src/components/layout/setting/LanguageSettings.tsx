import { useTranslation } from "react-i18next";
import { ChevronLeft, Check } from "lucide-react";
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';

interface LanguageSettingsProps {
  onBack: () => void;
}

export const LanguageSettings = ({ onBack }: LanguageSettingsProps) => {
  const { t } = useTranslation("common");
  const { changeLanguage, getCurrentLanguage } = useSettings();
  const currentLanguage = getCurrentLanguage();

  const languages = [
    { code: "en", name: "English" },
    { code: "vi", name: "Tiếng Việt" },
    // Thêm ngôn ngữ khác nếu cần
  ];

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="space-y-4"
    >
      {/* Header với nút back */}
      <div className="flex items-center space-x-4 p-4 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-medium">{t("settings.language")}</h3>
      </div>

      {/* Danh sách ngôn ngữ */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileTap={{ scale: 0.98 }}
            onClick={() => changeLanguage(lang.code)}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <span>{lang.name}</span>
            {currentLanguage === lang.code && (
              <Check className="w-5 h-5 text-blue-500" />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};