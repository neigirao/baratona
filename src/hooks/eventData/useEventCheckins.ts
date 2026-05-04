import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';
import { useRealtimeTable } from './useRealtimeTable';

type EventCheckin = Database['public']['Tables']['event_checkins']['Row'];

export function useEventCheckins(eventId: string | null) {
  const { data: checkins, loading, refetch } = useRealtimeTable<EventCheckin>('event_checkins', eventId);

  const checkIn = useCallback(async (userId: string, barId: string) => {
    if (!eventId) return false;
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('event_checkins')
          .insert({ event_id: eventId, user_id: userId, bar_id: barId });
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      await refetch();
      return true;
    } catch (e) {
      console.error('Error event check-in:', e);
      return false;
    }
  }, [eventId, refetch]);

  const checkOut = useCallback(async (userId: string, barId: string) => {
    if (!eventId) return false;
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('event_checkins').delete()
          .eq('event_id', eventId).eq('user_id', userId).eq('bar_id', barId);
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      await refetch();
      return true;
    } catch (e) {
      console.error('Error event check-out:', e);
      return false;
    }
  }, [eventId, refetch]);

  const isCheckedIn = useCallback(
    (userId: string, barId: string) => checkins.some(c => c.user_id === userId && c.bar_id === barId),
    [checkins],
  );

  const getBarCheckins = useCallback(
    (barId: string) => checkins.filter(c => c.bar_id === barId),
    [checkins],
  );

  return { checkins, loading, checkIn, checkOut, isCheckedIn, getBarCheckins, refetch };
}
