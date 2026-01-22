import { useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { MapPin, Clock, CheckCircle, Circle, Star, Loader2, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarRadarChart } from './BarRadarChart';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export function BarItinerary() {
  const { appConfig, bars, barsLoading, getProjectedTime, getBarVotes } = useBaratona();
  const [selectedBarId, setSelectedBarId] = useState<number | null>(null);
  
  if (barsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }
  
  const getBarStatus = (barId: number) => {
    if (!appConfig) return 'upcoming';
    if (barId < appConfig.current_bar_id!) return 'completed';
    if (barId === appConfig.current_bar_id) return 'current';
    return 'upcoming';
  };
  
  const getAverageRating = (barId: number) => {
    const barVotes = getBarVotes(barId);
    if (barVotes.length === 0) return null;
    
    const avg = barVotes.reduce((sum, v) => {
      return sum + (v.drink_score + v.food_score + v.vibe_score + v.service_score) / 4;
    }, 0) / barVotes.length;
    
    return avg.toFixed(1);
  };
  
  const selectedBar = bars.find(b => b.id === selectedBarId);
  const selectedBarVotes = selectedBarId ? getBarVotes(selectedBarId) : [];
  
  return (
    <>
      <div className="space-y-3 animate-slide-up">
        <h3 className="font-display text-sm font-semibold text-muted-foreground px-1">
          Itinerário
        </h3>
        
        <div className="space-y-2">
          {bars.map((bar) => {
            const status = getBarStatus(bar.id);
            const avgRating = getAverageRating(bar.id);
            
            return (
              <button
                key={bar.id}
                onClick={() => setSelectedBarId(bar.id)}
                className={cn(
                  "bar-card flex items-start gap-3 transition-all w-full text-left cursor-pointer hover:scale-[1.01]",
                  status === 'current' && "bar-card-active",
                  status === 'completed' && "bar-card-completed"
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-baratona-green" />
                  ) : status === 'current' ? (
                    <div className="w-5 h-5 rounded-full bg-primary pulse-glow flex items-center justify-center">
                      <Circle className="w-2 h-2 text-primary-foreground fill-current" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                {/* Bar Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-bold text-primary">
                      #{bar.bar_order}
                    </span>
                    <h4 className={cn(
                      "font-semibold truncate",
                      status === 'current' ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {bar.name}
                    </h4>
                    
                    {avgRating && (
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-3 h-3 text-secondary fill-secondary" />
                        <span className="text-xs font-medium text-secondary">{avgRating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{getProjectedTime(bar.scheduled_time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{bar.address}</span>
                    </div>
                  </div>
                </div>
                
                {/* Chevron */}
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Bar Details Drawer */}
      <Drawer open={selectedBarId !== null} onOpenChange={(open) => !open && setSelectedBarId(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span className="text-primary font-display">#{selectedBar?.bar_order}</span>
              {selectedBar?.name}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-4">
            {/* Bar Address */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{selectedBar?.address}</span>
            </div>
            
            {/* Vote Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{selectedBarVotes.length} {selectedBarVotes.length === 1 ? 'avaliação' : 'avaliações'}</span>
            </div>
            
            {/* Radar Chart */}
            {selectedBarId && <BarRadarChart barId={selectedBarId} />}
            
            {/* Average Score */}
            {selectedBarId && getAverageRating(selectedBarId) && (
              <div className="flex items-center justify-center gap-2 py-2 bg-secondary/10 rounded-lg">
                <Star className="w-5 h-5 text-secondary fill-secondary" />
                <span className="text-lg font-bold text-secondary">
                  {getAverageRating(selectedBarId)}
                </span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
