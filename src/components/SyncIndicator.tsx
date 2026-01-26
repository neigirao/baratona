import { useBaratona } from '@/contexts/BaratonaContext';
import { RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncIndicatorProps {
  secondsAgo: number;
  isRefreshing: boolean;
}

export function SyncIndicator({ secondsAgo, isRefreshing }: SyncIndicatorProps) {
  const { language } = useBaratona();
  
  const formatTime = () => {
    if (secondsAgo < 5) {
      return language === 'pt' ? 'Agora' : 'Just now';
    }
    if (secondsAgo < 60) {
      return language === 'pt' 
        ? `há ${secondsAgo}s` 
        : `${secondsAgo}s ago`;
    }
    const minutes = Math.floor(secondsAgo / 60);
    return language === 'pt' 
      ? `há ${minutes}min` 
      : `${minutes}min ago`;
  };
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {isRefreshing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>{language === 'pt' ? 'Atualizando...' : 'Updating...'}</span>
        </>
      ) : (
        <>
          <Check className={cn(
            "w-3 h-3 transition-colors",
            secondsAgo < 10 ? "text-baratona-green" : "text-muted-foreground"
          )} />
          <span>{formatTime()}</span>
        </>
      )}
    </div>
  );
}
