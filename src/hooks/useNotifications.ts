import { useCallback, useEffect, useState } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;
    
    try {
      // Trigger vibration separately (not part of NotificationOptions in all browsers)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const sendVanDepartureNotification = useCallback((barName: string, minutes: number) => {
    return sendNotification(
      `🚐 Van partindo em ${minutes} minutos!`,
      {
        body: `Finalize no ${barName} e prepare-se para embarcar.`,
        tag: 'van-departure',
        requireInteraction: true,
      }
    );
  }, [sendNotification]);

  const sendBroadcastNotification = useCallback((message: string) => {
    return sendNotification(
      '📢 Comunicado Baratona',
      {
        body: message,
        tag: 'broadcast',
        requireInteraction: true,
      }
    );
  }, [sendNotification]);

  const sendCheckinNotification = useCallback((participantName: string, barName: string) => {
    return sendNotification(
      `🍻 ${participantName} chegou!`,
      {
        body: `${participantName} fez check-in no ${barName}`,
        tag: `checkin-${participantName}`,
      }
    );
  }, [sendNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendVanDepartureNotification,
    sendBroadcastNotification,
    sendCheckinNotification,
  };
}
