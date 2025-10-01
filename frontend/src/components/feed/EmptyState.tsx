// src/components/feed/EmptyState.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {}

export const EmptyState: React.FC<EmptyStateProps> = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="text-center p-12 text-foreground">
      <div className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6">
        <Plus className="w-12 h-12 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">
          {t('feed.empty.title') || 'Chưa có bài viết nào'}
        </h3>
        <p className="text-muted-foreground text-lg">
          {t('feed.empty.description') || 'Hãy tạo bài viết đầu tiên của bạn'}
        </p>
      </div>
      <Button 
        onClick={() => navigate('/post')}
        className="mt-8 h-12 px-8 rounded-2xl font-semibold"
      >
        <Plus className="w-5 h-5 mr-2" />
        {t('feed.createPost.button') || 'Tạo bài viết'}
      </Button>
    </div>
  );
};