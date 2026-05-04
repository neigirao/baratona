import type { Database } from '@/integrations/supabase/types';
import { useRealtimeTable } from './useRealtimeTable';

type EventBar = Database['public']['Tables']['event_bars']['Row'];

export function useEventBars(eventId: string | null) {
  const { data: bars, loading, refetch } = useRealtimeTable<EventBar>(
    'event_bars', eventId, { orderBy: 'bar_order' },
  );
  return { bars, loading, refetch };
}
