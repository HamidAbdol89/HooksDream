import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '../../utils/helpers';

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const notificationColors = {
  success: 'bg-green-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-white',
};

export const NotificationToast: React.FC = () => {
  // Temporarily disabled - notification system needs to be implemented
  // TODO: Implement notification system for Google Auth
  return null;
};
