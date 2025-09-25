// src/components/feed/ErrorState.tsx
import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="w-20 h-20 mx-auto bg-secondary/50 rounded-3xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold">{t('feed.error.title')}</h3>
          <p className="text-muted-foreground leading-relaxed">{error}</p>
        </div>
        <Button 
          onClick={onRetry}
          className="w-full h-12 rounded-2xl font-semibold"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          {t('common.tryAgain')}
        </Button>
      </div>
    </div>
  );
};