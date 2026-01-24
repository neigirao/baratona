import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

    const { error } = await supabase
      .from('checkins')
      .insert({
        participant_id: participantId,
        bar_id: barId,
      });
    
    if (error) {
      console.error('Error checking in:', error);
      // Revert optimistic update
      fetchCheckins();
      return false;
    }
    
    return true;
  }, [fetchCheckins]);

  const checkOut = useCallback(async (participantId: string, barId: number) => {
    // Optimistic update
    setCheckins(prev => prev.filter(c => 
      !(c.participant_id === participantId && c.bar_id === barId)
    ));

    const { error } = await supabase
      .from('checkins')
      .delete()
      .eq('participant_id', participantId)
      .eq('bar_id', barId);
    
    if (error) {
      console.error('Error checking out:', error);
      fetchCheckins();
      return false;
    }
    
    return true;
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
