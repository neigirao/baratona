import { useBaratona } from '@/contexts/BaratonaContext';
import { Bus, MapPin, Clock, Loader2 } from 'lucide-react';

export function VanStatus() {
  const { appConfig, appConfigLoading, bars, getCurrentBar, getNextBar, getProjectedTime, t } = useBaratona();
  
  if (appConfigLoading || !appConfig) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }
  
  const currentBar = getCurrentBar();
  const nextBar = getNextBar();
  
  if (appConfig.status === 'in_transit') {
    const originBar = bars.find(b => b.id === appConfig.origin_bar_id);
    const destBar = bars.find(b => b.id === appConfig.destination_bar_id);
    
    return (
      <div className="bg-secondary/10 border border-secondary/50 rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="status-badge status-in-transit">
            {t.inTransit}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="text-muted-foreground">{originBar?.name}</span>
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center van-pulse">
              <Bus className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-secondary font-bold">➔</span>
          </div>
          <span className="text-foreground font-semibold">{destBar?.name}</span>
        </div>
        
        {destBar && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{t.arrivalProjection}: {getProjectedTime(destBar.scheduled_time)}</span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-baratona-green/10 border border-baratona-green/50 rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="status-badge status-at-bar">
          {t.atBar}
        </span>
      </div>
      
      {currentBar && (
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-foreground">
            {currentBar.name}
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span>{currentBar.address}</span>
          </div>
        </div>
      )}
      
      {nextBar && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <span>{t.nextBar}:</span>
          <span className="text-primary font-medium">{nextBar.name}</span>
          <span>({getProjectedTime(nextBar.scheduled_time)})</span>
        </div>
      )}
    </div>
  );
}
