import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';

type EventCheckin = Database['public']['Tables']['event_checkins']['Row'];

export function useEventCheckins(eventId: string | null) {
  const [checkins, setCheckins] = useState<EventCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.from('event_checkins').select('*').eq('event_id', eventId);
    if (!error && data) setCheckins(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-checkins-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_checkins', filter: `event_id=eq.${eventId}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const checkIn = useCallback(async (userId: string, barId: string) => {
    if (!eventId) return false;
    const optimistic: EventCheckin = {
      id: crypto.randomUUID(), event_id: eventId, user_id: userId, bar_id: barId,
      checked_in_at: new Date().toISOString(),
    };
    setCheckins(prev => [...prev, optimistic]);
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('event_checkins')
          .insert({ event_id: eventId, user_id: userId, bar_id: barId });
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (e) {
      console.error('Error event check-in:', e);
      fetch();
      return false;
    }
  }, [eventId, fetch]);

  const checkOut = useCallback(async (userId: string, barId: string) => {
    if (!eventId) return false;
    setCheckins(prev => prev.filter(c => !(c.user_id === userId && c.bar_id === barId)));
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('event_checkins').delete()
          .eq('event_id', eventId).eq('user_id', userId).eq('bar_id', barId);
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (e) {
      console.error('Error event check-out:', e);
      fetch();
      return false;
    }
  }, [eventId, fetch]);

  const isCheckedIn = useCallback(
    (userId: string, barId: string) => checkins.some(c => c.user_id === userId && c.bar_id === barId),
    [checkins]
  );
  const getBarCheckins = useCallback(
    (barId: string) => checkins.filter(c => c.bar_id === barId),
    [checkins]
  );

  return { checkins, loading, checkIn, checkOut, isCheckedIn, getBarCheckins, refetch: fetch };
}
