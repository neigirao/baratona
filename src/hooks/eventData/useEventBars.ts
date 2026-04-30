import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventBar = Database['public']['Tables']['event_bars']['Row'];

export function useEventBars(eventId: string | null) {
  const [bars, setBars] = useState<EventBar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_bars').select('*').eq('event_id', eventId).order('bar_order');
    if (!error && data) setBars(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-bars-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_bars', filter: `event_id=eq.${eventId}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  return { bars, loading, refetch: fetch };
}
