import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/Card';

// Skeleton khi đang loading
export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="relative h-64 bg-gradient-to-r from-primary/20 to-secondary/20">
      <Skeleton className="w-full h-full" />
    </div>
    
    <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0">
          <div className="relative -mt-20 md:-mt-16">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
          <div className="flex-1 md:ml-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// Khi lỗi
export const ProfileError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="text-center py-12">
    <p className="text-red-500 mb-4">Error: {error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
    >
      Retry
    </button>
  </div>
);

// Khi user không tồn tại
export const UserNotFound = () => (
  <div className="text-center py-12">
    <p className="text-muted-foreground">User not found.</p>
  </div>
);
