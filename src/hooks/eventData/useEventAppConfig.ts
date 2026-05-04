import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';

type EventAppConfig = Database['public']['Tables']['event_app_config']['Row'];

export function useEventAppConfig(eventId: string | null) {
  const [appConfig, setAppConfig] = useState<EventAppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    await withRetry(async () => {
      const { data, error } = await supabase
        .from('event_app_config').select('*').eq('event_id', eventId).maybeSingle();
      if (error) throw error;
      setAppConfig(data);
    }, { maxAttempts: 3, baseDelay: 800 });
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-config-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_app_config', filter: `event_id=eq.${eventId}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const updateConfig = useCallback(async (updates: Partial<Omit<EventAppConfig, 'id' | 'event_id' | 'updated_at'>>) => {
    if (!eventId) return false;
    const { error } = await supabase.from('event_app_config').update(updates).eq('event_id', eventId);
    if (error) { console.error('Error updating event config:', error); return false; }
    return true;
  }, [eventId]);

  return { appConfig, loading, updateConfig, refetch: fetch };
}
