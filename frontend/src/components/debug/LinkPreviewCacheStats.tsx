// src/components/debug/LinkPreviewCacheStats.tsx
import React from 'react';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import { Trash2, Database, Clock } from 'lucide-react';

export const LinkPreviewCacheStats: React.FC = () => {
  const { getCacheStats, clearCache } = useLinkPreview();
  const stats = getCacheStats();

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Link Preview Cache</h3>
      </div>
      
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Cached URLs:</span>
          <span className="font-mono">{stats.size}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Storage Size:</span>
          <span className="font-mono">{stats.totalSize}</span>
        </div>
        
        <div className="flex items-center gap-1 text-xs">
          <Clock className="w-3 h-3" />
          <span>7 days expiration</span>
        </div>
      </div>
      
      <button
        onClick={clearCache}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Clear Cache
      </button>
    </div>
  );
};
