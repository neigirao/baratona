import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/hooks/useRetry';

interface Options {
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Generic hook: fetch + realtime subscription for any event_* table.
 * Handles initial load with retry, realtime updates, and cleanup.
 */
export function useRealtimeTable<T>(
  table: string,
  eventId: string | null,
  options: Options = {}
): { data: T[]; loading: boolean; refetch: () => Promise<void> } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    await withRetry(async () => {
      let query = (supabase as unknown as { from: (t: string) => any })
        .from(table)
        .select('*')
        .eq('event_id', eventId);
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }
      const { data: rows, error } = await query;
      if (error) throw error;
      setData(rows ?? []);
    }, { maxAttempts: 3, baseDelay: 800 });
    setLoading(false);
  }, [eventId, table, options.orderBy, options.ascending]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`${table}-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table, filter: `event_id=eq.${eventId}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, table, fetch]);

  return { data, loading, refetch: fetch };
}
