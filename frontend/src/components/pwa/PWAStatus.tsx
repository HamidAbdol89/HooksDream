// PWA Status Component - Monitor PWA features and capabilities
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Download, Wifi, WifiOff, Database, Smartphone } from 'lucide-react';
import { pwaManager, PWAStatus as PWAStatusType, PWACapabilities } from '@/services/pwaManager';
import { Button } from '@/components/ui/Button';

interface PWAStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<PWAStatusType | null>(null);
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);
  const [isExpanded, setIsExpanded] = useState(showDetails);

  useEffect(() => {
    // Get initial status
    const updateStatus = async () => {
      const [currentStatus, currentCapabilities] = await Promise.all([
        pwaManager.getStatus(),
        Promise.resolve(pwaManager.getCapabilities())
      ]);
      
      setStatus(currentStatus);
      setCapabilities(currentCapabilities);
    };

    updateStatus();

    // Subscribe to status changes
    const unsubscribe = pwaManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Update status periodically
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleInstallApp = async () => {
    const success = await pwaManager.showInstallPrompt();
    if (success) {
      console.log('App installation initiated');
    }
  };

  const handleEnableNotifications = async () => {
    const success = await pwaManager.setupPushNotifications();
    if (success) {
      console.log('Push notifications enabled');
    }
  };

  if (!status || !capabilities) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-xs text-gray-500">Loading PWA status...</span>
      </div>
    );
  }

  const getConnectionStatus = () => {
    if (status.isOnline) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Wifi className="w-3 h-3" />
          <span className="text-xs">Online</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <WifiOff className="w-3 h-3" />
          <span className="text-xs">Offline</span>
        </div>
      );
    }
  };

  const getInstallStatus = () => {
    if (status.isInstalled) {
      return (
        <div className="flex items-center gap-1 text-blue-600">
          <Smartphone className="w-3 h-3" />
          <span className="text-xs">Installed</span>
        </div>
      );
    } else if (capabilities.installable) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInstallApp}
          className="h-6 px-2 text-xs"
        >
          <Download className="w-3 h-3 mr-1" />
          Install
        </Button>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Smartphone className="w-3 h-3" />
          <span className="text-xs">Web</span>
        </div>
      );
    }
  };

  const getNotificationStatus = () => {
    if (status.hasNotificationPermission) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Bell className="w-3 h-3" />
          {status.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
              {status.unreadCount}
            </span>
          )}
        </div>
      );
    } else if (capabilities.pushNotifications) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEnableNotifications}
          className="h-6 px-2 text-xs"
        >
          <BellOff className="w-3 h-3 mr-1" />
          Enable
        </Button>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <BellOff className="w-3 h-3" />
        </div>
      );
    }
  };

  const getStorageStatus = () => {
    const { percentage } = status.storageUsage;
    const color = percentage > 80 ? 'text-red-600' : percentage > 60 ? 'text-yellow-600' : 'text-green-600';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Database className="w-3 h-3" />
        <span className="text-xs">{percentage}%</span>
      </div>
    );
  };

  // Compact view
  if (!isExpanded) {
    return (
      <div 
        className={`flex items-center gap-2 cursor-pointer ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        {getConnectionStatus()}
        {getInstallStatus()}
        {getNotificationStatus()}
        {status.pendingActionsCount > 0 && (
          <div className="flex items-center gap-1 text-orange-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs">{status.pendingActionsCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Expanded view
  return (
    <div className={`bg-white border rounded-lg p-3 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">PWA Status</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="h-6 px-2 text-xs"
        >
          ×
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Connection</span>
          {getConnectionStatus()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Installation</span>
          {getInstallStatus()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Notifications</span>
          {getNotificationStatus()}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Storage</span>
          {getStorageStatus()}
        </div>

        {status.pendingActionsCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Pending Sync</span>
            <div className="flex items-center gap-1 text-orange-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-xs">{status.pendingActionsCount} actions</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">
            Capabilities: {Object.values(capabilities).filter(Boolean).length}/
            {Object.keys(capabilities).length} supported
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAStatus;
