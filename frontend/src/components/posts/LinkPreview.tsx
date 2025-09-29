// src/components/posts/LinkPreview.tsx
import React, { memo } from 'react';
import { ExternalLink, Globe, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: string;
  publishedTime?: string;
  author?: string;
  favicon?: string;
  crawledAt: string;
}

interface LinkPreviewProps {
  preview: LinkPreviewData;
  className?: string;
  onClick?: () => void;
}

export const LinkPreview: React.FC<LinkPreviewProps> = memo(({
  preview,
  className,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Open link in new tab
      window.open(preview.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div
      className={cn(
        "group border border-border rounded-xl overflow-hidden bg-card hover:bg-accent/50 transition-colors cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {/* Image */}
      {preview.image && (
        <div className="aspect-video sm:aspect-[2/1] overflow-hidden bg-muted">
          <img
            src={preview.image}
            alt={preview.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Site info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {preview.favicon ? (
            <img
              src={preview.favicon}
              alt=""
              className="w-4 h-4 rounded-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          <span className="font-medium">
            {preview.siteName || getDomain(preview.url)}
          </span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </div>

        {/* Title */}
        {preview.title && (
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {preview.title}
          </h3>
        )}

        {/* Description */}
        {preview.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          {preview.author && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{preview.author}</span>
            </div>
          )}
          
          {preview.publishedTime && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(preview.publishedTime)}</span>
            </div>
          )}
        </div>

        {/* URL */}
        <div className="text-xs text-muted-foreground/70 truncate pt-1 border-t border-border/50">
          {preview.url}
        </div>
      </div>
    </div>
  );
});

LinkPreview.displayName = 'LinkPreview';

// Multiple Link Previews Component
interface LinkPreviewsProps {
  previews: LinkPreviewData[];
  className?: string;
  maxPreviews?: number;
}

export const LinkPreviews: React.FC<LinkPreviewsProps> = memo(({
  previews,
  className,
  maxPreviews = 3
}) => {
  if (!previews || previews.length === 0) return null;

  const displayPreviews = previews.slice(0, maxPreviews);
  const hasMore = previews.length > maxPreviews;

  return (
    <div className={cn("space-y-3", className)}>
      {displayPreviews.map((preview, index) => (
        <LinkPreview
          key={`${preview.url}-${index}`}
          preview={preview}
        />
      ))}
      
      {hasMore && (
        <div className="text-xs text-muted-foreground text-center py-2 border border-dashed border-border rounded-lg">
          +{previews.length - maxPreviews} more link{previews.length - maxPreviews > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
});

LinkPreviews.displayName = 'LinkPreviews';
