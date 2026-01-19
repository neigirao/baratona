import { useState, useEffect, useMemo } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Clock, Bus, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CountdownTimer() {
  const { appConfig, getNextBar, getProjectedTime, t } = useBaratona();
  const [now, setNow] = useState(new Date());

  // Update "now" every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const nextBar = getNextBar();

  // Calculate time remaining until next bar departure
  const timeRemaining = useMemo(() => {
    if (!nextBar) return null;

    const projectedTime = getProjectedTime(nextBar.scheduled_time);
    const [hours, minutes] = projectedTime.split(':').map(Number);

    // Create target date (today or tomorrow if time has passed)
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // If target is before now, assume it's tomorrow (for late night bars like 01:30)
    if (target < now) {
      target.setDate(target.getDate() + 1);
    }

    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };

    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return { hours: h, minutes: m, seconds: s, total: totalSeconds };
  }, [nextBar, getProjectedTime, now]);

  // If in transit or no next bar, don't show
  if (appConfig?.status === 'in_transit' || !nextBar || !timeRemaining) {
    return null;
  }

  const isUrgent = timeRemaining.total <= 600; // 10 minutes
  const isVeryUrgent = timeRemaining.total <= 300; // 5 minutes

  return (
    <div
      className={cn(
        'bar-card transition-all duration-300',
        isVeryUrgent && 'border-destructive card-glow-red',
        isUrgent && !isVeryUrgent && 'border-secondary card-glow-yellow'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              'w-5 h-5',
              isVeryUrgent ? 'text-destructive' : isUrgent ? 'text-secondary' : 'text-primary'
            )}
          />
          <span className="text-sm text-muted-foreground">{t.nextBar}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{nextBar.name}</span>
        </div>
      </div>

      {/* Countdown Display */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <TimeUnit value={timeRemaining.hours} label="h" urgent={isVeryUrgent} warning={isUrgent} />
        <span className={cn('text-2xl font-bold', isVeryUrgent ? 'text-destructive' : 'text-muted-foreground')}>:</span>
        <TimeUnit value={timeRemaining.minutes} label="m" urgent={isVeryUrgent} warning={isUrgent} />
        <span className={cn('text-2xl font-bold', isVeryUrgent ? 'text-destructive' : 'text-muted-foreground')}>:</span>
        <TimeUnit value={timeRemaining.seconds} label="s" urgent={isVeryUrgent} warning={isUrgent} />
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <Bus className="w-4 h-4" />
        <span>
          {isVeryUrgent
            ? '⚠️ Saindo em breve!'
            : isUrgent
            ? '🏃 Prepare-se para sair'
            : `Partida às ${getProjectedTime(nextBar.scheduled_time)}`}
        </span>
      </div>
    </div>
  );
}

function TimeUnit({
  value,
  label,
  urgent,
  warning,
}: {
  value: number;
  label: string;
  urgent: boolean;
  warning: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold font-mono',
          urgent
            ? 'bg-destructive/20 text-destructive border border-destructive'
            : warning
            ? 'bg-secondary/20 text-secondary border border-secondary'
            : 'bg-muted text-foreground border border-border'
        )}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
