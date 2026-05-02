import { useCallback } from 'react';

interface Bar {
  id: unknown;
  bar_order?: number;
}

interface AppConfig {
  current_bar_id?: unknown;
  global_delay_minutes?: number;
}

/**
 * Shared computed helpers used by both BaratonaProvider (legacy) and
 * EventBaratonaProvider (platform). Keeps the two providers in sync
 * without duplicating logic.
 */
export function useBaratonaComputed<B extends Bar>(
  bars: B[],
  appConfig: AppConfig | null
) {
  const getProjectedTime = useCallback(
    (scheduledTime: string): string => {
      const delay = appConfig?.global_delay_minutes || 0;
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const total = hours * 60 + minutes + delay;
      return (
        `${Math.floor(total / 60) % 24}`.padStart(2, '0') +
        ':' +
        `${total % 60}`.padStart(2, '0')
      );
    },
    [appConfig?.global_delay_minutes]
  );

  const getCurrentBar = useCallback((): B | undefined => {
    if (!appConfig?.current_bar_id) return undefined;
    return bars.find((b) => b.id === appConfig.current_bar_id);
  }, [appConfig, bars]);

  const getNextBar = useCallback((): B | undefined => {
    const current = bars.find((b) => b.id === appConfig?.current_bar_id);
    if (!current) return undefined;
    const idx = bars.findIndex((b) => b.id === current.id);
    return idx < bars.length - 1 ? bars[idx + 1] : undefined;
  }, [appConfig, bars]);

  return { getProjectedTime, getCurrentBar, getNextBar };
}
