import React, { useRef, useEffect } from 'react';
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
  isMobile: boolean;
  adjustTextareaHeight: () => void;
}

export const ContentInput: React.FC<ContentInputProps> = ({
  content,
  setContent,
  isTextExpanded,
  setIsTextExpanded,
  isSubmitting,
  isMobile,
  adjustTextareaHeight
}) => {
  const { t } = useTranslation('common');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, isTextExpanded, adjustTextareaHeight]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          adjustTextareaHeight();
        }}
        placeholder={t('createPost.contentPlaceholder')}
        className={`
          resize-none border-0 px-0 py-0 leading-relaxed 
          placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:outline-none
          ${isMobile 
            ? 'min-h-[100px] max-h-[300px] text-base' 
            : 'min-h-[120px] max-h-[400px] text-base'
          }
        `}
        maxLength={5000}
        disabled={isSubmitting}
      />
      
      {/* Character Count */}
      <div className="flex justify-between items-center mt-2">
        <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {content.length}/5000
        </span>
        {content.length > 100 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsTextExpanded(!isTextExpanded)}
            className={`text-muted-foreground hover:text-primary ${isMobile ? 'h-6 px-2 text-xs' : 'h-6 px-2 text-xs'}`}
          >
            {isTextExpanded ? (
              <>
                <Shrink className="w-3 h-3 mr-1" />
                {t('createPost.collapse')}
              </>
            ) : (
              <>
                <Expand className="w-3 h-3 mr-1" />
                {t('createPost.expand')}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};