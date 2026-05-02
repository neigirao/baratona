import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';
import { isLegacyReadOnly } from '@/lib/legacyMode';
import { toast } from 'sonner';

type Vote = Database['public']['Tables']['votes']['Row'];

export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    const { data, error } = await supabase.from('votes').select('*');
    if (!error && data) setVotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVotes();
    const channel = supabase
      .channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchVotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchVotes]);

  const submitVote = useCallback(async (
    participantId: string,
    barId: number,
    scores: { drinkScore: number; foodScore: number; vibeScore: number; serviceScore: number }
  ) => {
    if (isLegacyReadOnly()) {
      toast.info('Evento legado em modo somente leitura.');
      return false;
    }
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('votes')
          .upsert({
            participant_id: participantId,
            bar_id: barId,
            drink_score: scores.drinkScore,
            food_score: scores.foodScore,
            vibe_score: scores.vibeScore,
            service_score: scores.serviceScore,
          }, { onConflict: 'participant_id,bar_id' });
        if (error) throw error;
        return true;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (error) {
      console.error('Error submitting vote after retries:', error);
      return false;
    }
  }, []);

  const getBarVotes = useCallback((barId: number) => votes.filter(v => v.bar_id === barId), [votes]);

  return { votes, loading, submitVote, getBarVotes, refetch: fetchVotes };
}
