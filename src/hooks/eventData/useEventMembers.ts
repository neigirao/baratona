import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventMember = Database['public']['Tables']['event_members']['Row'];

export function useEventMembers(eventId: string | null) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.from('event_members').select('*').eq('event_id', eventId);
    if (!error && data) setMembers(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-members-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_members', filter: `event_id=eq.${eventId}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  return { members, loading, refetch: fetch };
}
