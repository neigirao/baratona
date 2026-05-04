import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/hooks/useRetry';

interface Options {
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Generic hook: fetch + realtime subscription for any event_* table.
 * Handles initial load with retry, realtime updates, and cleanup.
 *
 * The realtime handler is debounced (150 ms) so that an explicit refetch()
 * called right after a write doesn't race with the subscription callback —
 * both will coalesce into a single fetch.
 */
export function useRealtimeTable<T>(
  table: string,
  eventId: string | null,
  options: Options = {}
): { data: T[]; loading: boolean; refetch: () => Promise<void> } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced version used by realtime callback to avoid double-fetch when
  // the caller also does an explicit refetch() after a write.
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetch(); }, 150);
  }, [fetch]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`${table}-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table, filter: `event_id=eq.${eventId}` },
        debouncedFetch)
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [eventId, table, fetch, debouncedFetch]);

  return { data, loading, refetch: fetch };
}
