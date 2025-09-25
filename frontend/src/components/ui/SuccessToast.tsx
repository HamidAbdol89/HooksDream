import React, { createContext, useContext, useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastContextType {
  showSuccess: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showSuccess: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    isVisible: boolean;
  }>({
    title: '',
    description: '',
    isVisible: false,
  });

  const showSuccess = (title: string, description?: string) => {
    setToast({
      title,
      description,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (toast.isVisible) {
      const timer = setTimeout(hideToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.isVisible]);

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
        <div
          className={`
            mt-4 px-4 py-3 mx-4
            bg-white dark:bg-gray-800
            rounded-full
            shadow-lg
            flex items-center gap-2.5
            min-w-[200px] max-w-[280px] sm:max-w-[320px]
            border border-gray-200 dark:border-gray-700
            backdrop-blur-sm
            pointer-events-auto
            transform transition-all duration-500 ease-out
            ${toast.isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : '-translate-y-full opacity-0 scale-95'
            }
          `}
        >
          {/* Success Icon */}
          <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {toast.title}
            </div>
            {toast.description && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {toast.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useSuccessToast = () => useContext(ToastContext);