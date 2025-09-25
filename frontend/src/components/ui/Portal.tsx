// components/ui/Portal.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export const Portal: React.FC<PortalProps> = ({ 
  children, 
  containerId = 'portal-root' 
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Tìm hoặc tạo container cho portal
    let portalContainer = document.getElementById(containerId);
    
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = containerId;
      portalContainer.style.position = 'relative';
      portalContainer.style.zIndex = '1000';
      document.body.appendChild(portalContainer);
    }
    
    setContainer(portalContainer);
    
    return () => {
      // Không xóa container để tránh flash khi unmount
      // Chỉ xóa nếu thực sự cần thiết
    };
  }, [containerId]);

  if (!container) return null;

  return createPortal(children, container);
};