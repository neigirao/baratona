import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/hooks/useRetry';
import { isLegacyReadOnly } from '@/lib/legacyMode';
import { toast } from 'sonner';

interface Checkin {
  id: string;
  participant_id: string;
  bar_id: number;
  checked_in_at: string;
}

export function useCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckins = useCallback(async () => {
    const { data, error } = await supabase
      .from('checkins')
      .select('*');
    
    if (!error && data) {
      setCheckins(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCheckins();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('checkins-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins' },
        () => fetchCheckins()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCheckins]);

  const checkIn = useCallback(async (participantId: string, barId: number) => {
    // Optimistic update
    const optimisticCheckin: Checkin = {
      id: crypto.randomUUID(),
      participant_id: participantId,
      bar_id: barId,
      checked_in_at: new Date().toISOString(),
    };
    setCheckins(prev => [...prev, optimisticCheckin]);
    
    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);

    try {
      await withRetry(
        async () => {
          const { error } = await supabase
            .from('checkins')
            .insert({
              participant_id: participantId,
              bar_id: barId,
            });
          
          if (error) throw error;
          return true;
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          onRetry: (attempt) => {
            console.log(`[Check-in] Retrying attempt ${attempt}...`);
          },
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error checking in after retries:', error);
      // Revert optimistic update
      fetchCheckins();
      return false;
    }
  }, [fetchCheckins]);

  const checkOut = useCallback(async (participantId: string, barId: number) => {
    // Optimistic update
    setCheckins(prev => prev.filter(c => 
      !(c.participant_id === participantId && c.bar_id === barId)
    ));

    try {
      await withRetry(
        async () => {
          const { error } = await supabase
            .from('checkins')
            .delete()
            .eq('participant_id', participantId)
            .eq('bar_id', barId);
          
          if (error) throw error;
          return true;
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error checking out after retries:', error);
      fetchCheckins();
      return false;
    }
  }, [fetchCheckins]);

  const getBarCheckins = useCallback((barId: number) => {
    return checkins.filter(c => c.bar_id === barId);
  }, [checkins]);

  const isCheckedIn = useCallback((participantId: string, barId: number) => {
    return checkins.some(c => 
      c.participant_id === participantId && c.bar_id === barId
    );
  }, [checkins]);

  return {
    checkins,
    loading,
    checkIn,
    checkOut,
    getBarCheckins,
    isCheckedIn,
  };
}
