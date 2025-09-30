import { useState, useEffect, useCallback } from 'react';
import { pushService, PushSubscriptionData } from '@/services/pushService';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
    default: Notification.permission === 'default'
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      initializePushNotifications();
    }
  }, []);

  const initializePushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const result = await Notification.requestPermission();
    
    setPermission({
      granted: result === 'granted',
      denied: result === 'denied',
      default: result === 'default'
    });

    return result === 'granted';
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!permission.granted) {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      });

      setSubscription(subscription);
      
      // Send subscription to server
      const token = localStorage.getItem('google_auth_token');
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }, [permission.granted, requestPermission]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      
      // Notify server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }, [subscription]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!permission.granted) return;

    return new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      ...options
    });
  }, [permission.granted]);

  return {
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
