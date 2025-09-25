// src/components/posts/PostContent.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PostContentProps {
  content: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PostContent: React.FC<PostContentProps> = ({
  content,
  isExpanded,
  onToggleExpand
}) => {
  const isMobile = useIsMobile();

  if (!content) return null;

  const maxLength = isMobile ? 150 : 280;
  const shouldClamp = !isExpanded && content.length > maxLength;

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

      {content.length > maxLength && (
        <button
          onClick={onToggleExpand}
          className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors font-medium"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};
