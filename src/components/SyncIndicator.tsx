import { useBaratona } from '@/contexts/BaratonaContext';
import { RefreshCw, Check, WifiOff } from 'lucide-react';
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
  
  const isStale = secondsAgo > 30 && !isRefreshing;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs transition-colors", isStale ? "text-amber-500" : "text-muted-foreground")}>
      {isRefreshing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>{language === 'pt' ? 'Atualizando...' : 'Updating...'}</span>
        </>
      ) : isStale ? (
        <>
          <WifiOff className="w-3 h-3" />
          <span>{language === 'pt' ? 'Reconectando...' : 'Reconnecting...'}</span>
        </>
      ) : (
        <>
          <Check className={cn("w-3 h-3 transition-colors", secondsAgo < 10 ? "text-baratona-green" : "text-muted-foreground")} />
          <span>{formatTime()}</span>
        </>
      )}
    </div>
  );
}
