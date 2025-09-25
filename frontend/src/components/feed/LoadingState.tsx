import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  small?: boolean; // optional, dùng cho overlay loading
  count?: number;  // số skeleton post muốn hiển thị
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  small = false,
  count = 3
}) => {
  const { t } = useTranslation('common');
  const padding = small ? 'p-2' : 'p-4';
  const gap = small ? 'gap-2' : 'gap-4';
  const avatarSize = small ? 'w-6 h-6' : 'w-10 h-10';
  const headerLineH = small ? 'h-2' : 'h-3';
  const headerLineW1 = small ? 'w-2/3' : 'w-3/4';
  const headerLineW2 = small ? 'w-1/2' : 'w-1/2';
  const contentLineH = small ? 'h-2' : 'h-3';
  const contentWidths = small
    ? ['w-full', 'w-5/6', 'w-2/3']
    : ['w-full', 'w-5/6', 'w-2/3'];

  return (
    <div className={`flex flex-col ${gap} ${padding}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse flex flex-col gap-2 ${padding} bg-white/5 rounded-xl shadow-sm`}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`${avatarSize} bg-white/20 rounded-full`} />
            <div className="flex-1 space-y-1">
              <div className={`${headerLineH} bg-white/20 rounded ${headerLineW1}`} />
              <div className={`${headerLineH} bg-white/10 rounded ${headerLineW2}`} />
            </div>
          </div>

          {/* Content */}
          <div className="mt-3 space-y-2">
            {contentWidths.map((w, idx) => (
              <div key={idx} className={`${contentLineH} bg-white/20 rounded ${w}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};