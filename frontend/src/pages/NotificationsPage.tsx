import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Repeat2, 
  AtSign,
  FileText,
  MoreHorizontal,
  Check,
  Trash2,
  Settings
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: any;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (url: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}) => {
  const [showActions, setShowActions] = useState(false);

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (type) {
      case 'like':
        return <Heart {...iconProps} className="w-4 h-4 text-red-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle {...iconProps} className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus {...iconProps} className="w-4 h-4 text-green-500" />;
      case 'repost':
        return <Repeat2 {...iconProps} className="w-4 h-4 text-purple-500" />;
      case 'mention':
        return <AtSign {...iconProps} className="w-4 h-4 text-orange-500" />;
      case 'post_from_following':
        return <FileText {...iconProps} className="w-4 h-4 text-gray-500" />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification._id);
    }
    onClick(notification.url);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead(notification._id);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification._id);
    setShowActions(false);
  };

  return (
    <div 
      className={`relative p-4 border-b hover:bg-accent/50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={notification.sender.avatar} 
              alt={notification.sender.displayName} 
            />
            <AvatarFallback>
              {notification.sender.displayName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {/* Notification type icon */}
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border">
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">
                  {notification.sender.displayName}
                  {notification.sender.isVerified && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0">
                      ✓
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground ml-1">
                  {notification.message}
                </span>
              </p>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {showActions && (
                <div className="absolute right-0 top-8 bg-popover border rounded-lg shadow-lg z-10 min-w-[120px]">
                  {!notification.isRead && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
                      onClick={handleMarkAsRead}
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as read</span>
                    </button>
                  )}
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-destructive flex items-center space-x-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click overlay to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Real state for notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // API helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Debug all localStorage keys
    console.log('All localStorage keys:', Object.keys(localStorage));
    console.log('localStorage contents:', {
      user_hash_id: localStorage.getItem('user_hash_id'),
      token: localStorage.getItem('token'),
      authToken: localStorage.getItem('authToken'),
      user: localStorage.getItem('user'),
      accessToken: localStorage.getItem('accessToken')
    });
    
    const token = localStorage.getItem('auth_token');
    
    console.log('Token check:', { token: token ? 'Present' : 'Missing', length: token?.length });
    
    if (!token) {
      throw new Error('User not authenticated - no token found in localStorage');
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    console.log('API URL:', apiUrl);
    
    const response = await fetch(`${apiUrl}/api/notifications${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  };

  // Load notifications from API
  const loadNotifications = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await apiCall(`?page=${page}&limit=20`);
      console.log('Notifications API response:', data);
      
      if (data.success) {
        const { notifications: newNotifications, pagination, unreadCount: newUnreadCount } = data.data;
        console.log('Notifications data:', { 
          notificationsCount: newNotifications?.length, 
          unreadCount: newUnreadCount,
          notifications: newNotifications 
        });
        
        if (page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setUnreadCount(newUnreadCount);
        setHasMore(pagination.hasMore);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const data = await apiCall(`/${id}/read`, { method: 'PATCH' });
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      const data = await apiCall('/mark-all-read', { method: 'PATCH' });
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);
  
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const data = await apiCall(`/${id}`, { method: 'DELETE' });
      
      if (data.success) {
        setNotifications(prev => prev.filter(notification => notification._id !== id));
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);
  
  const clearAllNotifications = useCallback(async () => {
    try {
      const data = await apiCall('/clear-all', { method: 'DELETE' });
      
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, []);

  // Load initial notifications
  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = Math.floor(notifications.length / 20) + 1;
    await loadNotifications(nextPage);
    setLoadingMore(false);
  }, [loadingMore, hasMore, notifications.length, loadNotifications]);

  const handleNotificationClick = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      await clearAllNotifications();
    }
  }, [clearAllNotifications]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-destructive">Error loading notifications: {error}</p>
          <Button 
            onClick={() => loadNotifications(1)} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6" />
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-2 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/notifications/settings')}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              When someone likes, comments, or follows you, you'll see it here.
            </p>
          </div>
        ) : (
          <>
            {/* Notifications List */}
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}

            {/* Clear All */}
            {notifications.length > 0 && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-muted-foreground"
                >
                  Clear All Notifications
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
