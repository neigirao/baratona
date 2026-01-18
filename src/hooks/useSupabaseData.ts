import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];
type Bar = Database['public']['Tables']['bars']['Row'];
type AppConfig = Database['public']['Tables']['app_config']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];
type Consumption = Database['public']['Tables']['consumption']['Row'];

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setParticipants(data);
      }
      setLoading(false);
    };

    fetchParticipants();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { participants, loading };
}

export function useBars() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBars = async () => {
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .order('bar_order');
      
      if (!error && data) {
        setBars(data);
      }
      setLoading(false);
    };

    fetchBars();
  }, []);

  return { bars, loading };
}

export function useAppConfig() {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    
    if (!error && data) {
      setAppConfig(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('app-config-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        () => fetchConfig()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<Omit<AppConfig, 'id' | 'updated_at'>>) => {
    const { error } = await supabase
      .from('app_config')
      .update(updates)
      .eq('id', 1);
    
    if (error) {
      console.error('Error updating config:', error);
      return false;
    }
    return true;
  };

  return { appConfig, loading, updateConfig, refetch: fetchConfig };
}

export function useVotes() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('votes')
      .select('*');
    
    if (!error && data) {
      setVotes(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVotes();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => fetchVotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVotes]);

  const submitVote = async (
    participantId: string,
    barId: number,
    scores: { drinkScore: number; foodScore: number; vibeScore: number; serviceScore: number }
  ) => {
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
    
    if (error) {
      console.error('Error submitting vote:', error);
      return false;
    }
    return true;
  };

  const getBarVotes = (barId: number) => votes.filter(v => v.bar_id === barId);

  return { votes, loading, submitVote, getBarVotes };
}

export function useConsumption() {
  const [consumption, setConsumption] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, number>>(new Map());

  const fetchConsumption = useCallback(async () => {
    const { data, error } = await supabase
      .from('consumption')
      .select('*');
    
    if (!error && data) {
      setConsumption(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConsumption();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('consumption-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consumption' },
        () => fetchConsumption()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConsumption]);

  // Optimistic update helper
  const updateCount = async (participantId: string, type: 'drink' | 'food', delta: number) => {
    // Find current record
    const current = consumption.find(c => c.participant_id === participantId && c.type === type);
    if (!current) return false;

    const newCount = Math.max(0, current.count + delta);
    
    // Optimistic update
    setConsumption(prev => 
      prev.map(c => 
        c.participant_id === participantId && c.type === type
          ? { ...c, count: newCount }
          : c
      )
    );

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Actual update
    const { error } = await supabase
      .from('consumption')
      .update({ count: newCount })
      .eq('participant_id', participantId)
      .eq('type', type);
    
    if (error) {
      console.error('Error updating consumption:', error);
      // Revert optimistic update
      fetchConsumption();
      return false;
    }
    
    return true;
  };

  const addDrink = (participantId: string) => updateCount(participantId, 'drink', 1);
  const removeDrink = (participantId: string) => updateCount(participantId, 'drink', -1);
  const addFood = (participantId: string) => updateCount(participantId, 'food', 1);
  const removeFood = (participantId: string) => updateCount(participantId, 'food', -1);

  const getParticipantConsumption = (participantId: string) => {
    const drinks = consumption.find(c => c.participant_id === participantId && c.type === 'drink');
    const food = consumption.find(c => c.participant_id === participantId && c.type === 'food');
    return {
      drinks: drinks?.count || 0,
      food: food?.count || 0,
    };
  };

  const totalDrinks = consumption
    .filter(c => c.type === 'drink')
    .reduce((sum, c) => sum + c.count, 0);

  const totalFood = consumption
    .filter(c => c.type === 'food')
    .reduce((sum, c) => sum + c.count, 0);

  return { 
    consumption, 
    loading, 
    addDrink, 
    removeDrink, 
    addFood, 
    removeFood,
    getParticipantConsumption,
    totalDrinks,
    totalFood,
  };
}
