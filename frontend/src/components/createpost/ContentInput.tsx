// src/components/createpost/ContentInput.tsx
import React, { forwardRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Expand, Shrink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContentInputProps {
  content: string;
  setContent: (content: string) => void;
  isTextExpanded: boolean;
  setIsTextExpanded: (expanded: boolean) => void;
  isSubmitting: boolean;
  adjustTextareaHeight: () => void;
}

export const ContentInput = forwardRef<HTMLTextAreaElement, ContentInputProps>(({
  content,
  setContent,
  isTextExpanded,
  setIsTextExpanded,
  isSubmitting,
  adjustTextareaHeight
}, ref) => {
  const { t } = useTranslation('common');

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, isTextExpanded, adjustTextareaHeight]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          ref={ref}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            adjustTextareaHeight();
          }}
          placeholder={t('feed.createPost.placeholder', 'Bạn đang nghĩ gì?')}
          className={`
            resize-none border-0 px-0 py-0 leading-relaxed text-lg
            placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:outline-none
            ${isTextExpanded 
              ? 'min-h-[200px] max-h-[500px]' 
              : 'min-h-[120px] max-h-[300px]'
            }
          `}
          maxLength={5000}
          disabled={isSubmitting}
        />
      </div>
      
      {/* Character Count and Expand/Collapse */}
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground text-sm">
          {content.length}/5000
        </span>
        
        {content.length > 100 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsTextExpanded(!isTextExpanded)}
            className="text-muted-foreground hover:text-primary h-8 px-3 text-sm"
          >
            {isTextExpanded ? (
              <>
                <Shrink className="w-4 h-4 mr-2" />
                {t('createPost.collapse', 'Thu gọn')}
              </>
            ) : (
              <>
                <Expand className="w-4 h-4 mr-2" />
                {t('createPost.expand', 'Mở rộng')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Character warning */}
      {content.length > 4500 && (
        <div className="text-right">
          <span className={`text-sm ${content.length > 4900 ? 'text-destructive' : 'text-amber-500'}`}>
            {5000 - content.length} {t('createPost.charsLeft', 'ký tự còn lại')}
          </span>
        </div>
      )}
    </div>
  );
});
