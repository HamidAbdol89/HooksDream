// src/components/posts/PostContent.tsx
import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PostContentProps {
  content: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PostContent: React.FC<PostContentProps> = memo(({
  content,
  isExpanded,
  onToggleExpand
}) => {
  const isMobile = useIsMobile();

  if (!content) return null;

  // Memoize expensive calculations
  const { maxLength, shouldClamp, shouldShowToggle } = useMemo(() => {
    const maxLen = isMobile ? 150 : 280;
    const shouldClampText = !isExpanded && content.length > maxLen;
    const shouldShowToggleButton = content.length > maxLen;
    
    return {
      maxLength: maxLen,
      shouldClamp: shouldClampText,
      shouldShowToggle: shouldShowToggleButton
    };
  }, [isMobile, isExpanded, content.length]);

  return (
    <div className="px-3 sm:px-4 pb-2 sm:pb-3">
      <div
        className={cn(
          "text-foreground text-sm sm:text-[15px] leading-relaxed transition-all duration-300 cursor-text selection:bg-primary/20 whitespace-pre-wrap break-words",
          shouldClamp && "line-clamp-3"
        )}
        onClick={() => shouldClamp && onToggleExpand()}
      >
        {content}
      </div>

      {shouldShowToggle && (
        <button
          onClick={onToggleExpand}
          className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors font-medium"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
});

PostContent.displayName = 'PostContent';
