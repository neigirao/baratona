import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';
import { useRealtimeTable } from './useRealtimeTable';

type EventVote = Database['public']['Tables']['event_votes']['Row'];

export function useEventVotes(eventId: string | null) {
  const { data: votes, loading, refetch } = useRealtimeTable<EventVote>('event_votes', eventId);

  const submitVote = useCallback(async (
    userId: string,
    barId: string,
    scores: { drinkScore?: number; foodScore?: number; vibeScore?: number; serviceScore?: number; dishScore?: number }
  ) => {
    if (!eventId) return false;
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('event_votes').upsert({
            event_id: eventId, user_id: userId, bar_id: barId,
            drink_score: scores.drinkScore ?? null,
            food_score: scores.foodScore ?? null,
            vibe_score: scores.vibeScore ?? null,
            service_score: scores.serviceScore ?? null,
            dish_score: scores.dishScore ?? null,
          }, { onConflict: 'event_id,user_id,bar_id' });
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (e) {
      console.error('Error submitting event vote:', e);
      return false;
    }
  }, [eventId]);

  const getBarVotes = useCallback(
    (barId: string | number) => votes.filter(v => v.bar_id === String(barId)),
    [votes],
  );

  return { votes, loading, submitVote, getBarVotes, refetch };
}
