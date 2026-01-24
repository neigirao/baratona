import { useNotifications } from '@/hooks/useNotifications';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Bell, BellOff, Check } from 'lucide-react';

export function NotificationPrompt() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const { language } = useBaratona();
  
  if (!isSupported) return null;
  
  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-baratona-green/10 rounded-lg text-xs">
        <Check className="w-4 h-4 text-baratona-green" />
        <span className="text-baratona-green">
          {language === 'pt' ? 'Notificações ativas' : 'Notifications enabled'}
        </span>
      </div>
    );
  }
  
  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg text-xs">
        <BellOff className="w-4 h-4 text-destructive" />
        <span className="text-destructive">
          {language === 'pt' ? 'Notificações bloqueadas' : 'Notifications blocked'}
        </span>
      </div>
    );
  }
  
  return (
    <button
      onClick={requestPermission}
      className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg text-xs hover:bg-primary/20 transition-colors"
    >
      <Bell className="w-4 h-4 text-primary" />
      <span className="text-primary font-medium">
        {language === 'pt' ? 'Ativar notificações' : 'Enable notifications'}
      </span>
    </button>
  );
}
