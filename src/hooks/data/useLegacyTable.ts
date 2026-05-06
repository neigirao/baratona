import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type LegacyTableName = keyof Database['public']['Tables'];

interface Options {
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Generic hook: fetch + realtime subscription for legacy (non-event_*) tables.
 * Analogous to useRealtimeTable in hooks/eventData, but works on tables that
 * are not scoped by event_id. Uses a per-instance UUID channel to prevent
 * zombie channels when the hook is mounted multiple times.
 */
export function useLegacyTable<T>(
  table: LegacyTableName,
  options: Options = {},
): { data: T[]; loading: boolean; refetch: () => Promise<void> } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`${table}-${crypto.randomUUID()}`);
  const fetchVersion = useRef(0);

  const fetch = useCallback(async () => {
    const v = ++fetchVersion.current;
    let query = supabase.from(table).select('*');
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }
    const { data: rows, error } = await query;
    if (!error && rows && v === fetchVersion.current) setData(rows as T[]);
    if (v === fetchVersion.current) setLoading(false);
  }, [table, options.orderBy, options.ascending]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, fetch]);

  return { data, loading, refetch: fetch };
}
