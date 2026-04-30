import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';

type EventVote = Database['public']['Tables']['event_votes']['Row'];

export function useEventVotes(eventId: string | null) {
  const [votes, setVotes] = useState<EventVote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.from('event_votes').select('*').eq('event_id', eventId);
    if (!error && data) setVotes(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-votes-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_votes', filter: `event_id=eq.${eventId}` },
        () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const submitVote = useCallback(async (
    userId: string,
    barId: string,
    scores: { drinkScore?: number; foodScore?: number; vibeScore?: number; serviceScore?: number; dishScore?: number }
  ) => {
    if (!eventId) return false;
    try {
      await withRetry(async () => {
        const payload: Record<string, unknown> = {
          event_id: eventId, user_id: userId, bar_id: barId,
          drink_score: scores.drinkScore ?? null,
          food_score: scores.foodScore ?? null,
          vibe_score: scores.vibeScore ?? null,
          service_score: scores.serviceScore ?? null,
          dish_score: scores.dishScore ?? null,
        };
        const { error } = await supabase
          .from('event_votes').upsert(payload as any, { onConflict: 'event_id,user_id,bar_id' });
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (e) {
      console.error('Error submitting event vote:', e);
      return false;
    }
  }, [eventId]);

  const getBarVotes = useCallback((barId: string) => votes.filter(v => v.bar_id === barId), [votes]);

  return { votes, loading, submitVote, getBarVotes, refetch: fetch };
}
