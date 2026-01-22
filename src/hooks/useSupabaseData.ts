import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

  const updateConfig = useCallback(async (updates: Partial<Omit<AppConfig, 'id' | 'updated_at'>>) => {
    const { error } = await supabase
      .from('app_config')
      .update(updates)
      .eq('id', 1);
    
    if (error) {
      console.error('Error updating config:', error);
      return false;
    }
    return true;
  }, []);

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

  const submitVote = useCallback(async (
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
  }, []);

  const getBarVotes = useCallback(
    (barId: number) => votes.filter(v => v.bar_id === barId),
    [votes]
  );

  return { votes, loading, submitVote, getBarVotes };
}

export function useConsumption() {
  const [consumption, setConsumption] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use ref to access current consumption in callbacks without causing re-renders
  const consumptionRef = useRef<Consumption[]>(consumption);
  useEffect(() => {
    consumptionRef.current = consumption;
  }, [consumption]);

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

  // Stable updateCount using ref
  const updateCount = useCallback(async (participantId: string, type: 'drink' | 'food', delta: number) => {
    // Use ref to get current consumption
    const current = consumptionRef.current.find(c => c.participant_id === participantId && c.type === type);
    
    // If no record exists, create one
    if (!current) {
      const newCount = Math.max(0, delta);
      
      // Optimistic update - add new record
      const optimisticRecord: Consumption = {
        id: crypto.randomUUID(),
        participant_id: participantId,
        type,
        count: newCount,
        updated_at: new Date().toISOString(),
      };
      setConsumption(prev => [...prev, optimisticRecord]);
      
      // Insert new record
      const { error } = await supabase
        .from('consumption')
        .insert({
          participant_id: participantId,
          type,
          count: newCount,
        });
      
      if (error) {
        console.error('Error inserting consumption:', error);
        fetchConsumption();
        return false;
      }
      
      // Refetch to get the real ID
      fetchConsumption();
      return true;
    }

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
  }, [fetchConsumption]);

  const addDrink = useCallback(
    (participantId: string) => updateCount(participantId, 'drink', 1),
    [updateCount]
  );
  
  const removeDrink = useCallback(
    (participantId: string) => updateCount(participantId, 'drink', -1),
    [updateCount]
  );
  
  const addFood = useCallback(
    (participantId: string) => updateCount(participantId, 'food', 1),
    [updateCount]
  );
  
  const removeFood = useCallback(
    (participantId: string) => updateCount(participantId, 'food', -1),
    [updateCount]
  );

  const getParticipantConsumption = useCallback((participantId: string) => {
    const drinks = consumption.find(c => c.participant_id === participantId && c.type === 'drink');
    const food = consumption.find(c => c.participant_id === participantId && c.type === 'food');
    return {
      drinks: drinks?.count || 0,
      food: food?.count || 0,
    };
  }, [consumption]);

  const totalDrinks = useMemo(() => 
    consumption.filter(c => c.type === 'drink').reduce((sum, c) => sum + c.count, 0),
    [consumption]
  );

  const totalFood = useMemo(() => 
    consumption.filter(c => c.type === 'food').reduce((sum, c) => sum + c.count, 0),
    [consumption]
  );

  return { 
    consumption, 
    loading, 
    addDrink, 
    removeDrink, 
    addFood, 
    removeFood,
    updateConsumption: updateCount,
    getParticipantConsumption,
    totalDrinks,
    totalFood,
  };
}
