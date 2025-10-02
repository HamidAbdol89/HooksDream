import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Check } from 'lucide-react';

interface ToastContextType {
  showSuccess: (title: string, description?: string) => void;
}
const ToastContext = createContext<ToastContextType>({
  showSuccess: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showSuccess = (title: string, description?: string) => {
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-600" />
        <div>
          <div className="font-medium">{title}</div>
          {description && <div className="text-sm text-gray-600">{description}</div>}
        </div>
      </div>,
      {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#fff',
          color: '#333',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '12px 16px',
        },
      }
    );
  };

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

export const useSuccessToast = () => useContext(ToastContext);