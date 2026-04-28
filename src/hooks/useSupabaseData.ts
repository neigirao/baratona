import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';
import { isLegacyReadOnly } from '@/lib/legacyMode';
import { toast } from 'sonner';

type Participant = Database['public']['Tables']['participants']['Row'];
type Bar = Database['public']['Tables']['bars']['Row'];
type AppConfig = Database['public']['Tables']['app_config']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];
type Consumption = Database['public']['Tables']['consumption']['Row'];

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setParticipants(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
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
  }, [fetchParticipants]);

  return { participants, loading, refetch: fetchParticipants };
}

export function useBars() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBars = useCallback(async () => {
    const { data, error } = await supabase
      .from('bars')
      .select('*')
      .order('bar_order');
    
    if (!error && data) {
      setBars(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBars();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bars-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bars' },
        () => fetchBars()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBars]);

  return { bars, loading, refetch: fetchBars };
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
    try {
      await withRetry(
        async () => {
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
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          onRetry: (attempt) => {
            console.log(`[Vote] Retrying attempt ${attempt}...`);
          },
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error submitting vote after retries:', error);
      return false;
    }
  }, []);

  const getBarVotes = useCallback(
    (barId: number) => votes.filter(v => v.bar_id === barId),
    [votes]
  );

  return { votes, loading, submitVote, getBarVotes, refetch: fetchVotes };
}

export function useConsumption(currentBarId?: number | null) {
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

  // Stable updateCount using ref - now includes bar_id and optional subtype
  const updateCount = useCallback(async (
    participantId: string, 
    type: 'drink' | 'food', 
    delta: number,
    barId?: number | null,
    subtype?: string
  ) => {
    const effectiveBarId = barId ?? null;
    
    // Use ref to get current consumption - match by bar_id if provided
    const current = consumptionRef.current.find(c => 
      c.participant_id === participantId && 
      c.type === type && 
      c.bar_id === effectiveBarId
    );
    
    // If no record exists, create one
    if (!current) {
      const newCount = Math.max(0, delta);
      
      // Optimistic update - add new record
      const optimisticRecord = {
        id: crypto.randomUUID(),
        participant_id: participantId,
        type,
        count: newCount,
        bar_id: effectiveBarId,
        updated_at: new Date().toISOString(),
        subtype: subtype || null,
      } as Consumption;
      setConsumption(prev => [...prev, optimisticRecord]);
      
      // Insert new record with retry
      try {
        await withRetry(
          async () => {
            const insertData: Record<string, unknown> = {
              participant_id: participantId,
              type,
              count: newCount,
              bar_id: effectiveBarId,
            };
            if (subtype) insertData.subtype = subtype;
            const { error } = await supabase
              .from('consumption')
              .insert(insertData as any);
            
            if (error) throw error;
            return true;
          },
          {
            maxAttempts: 3,
            baseDelay: 1000,
          }
        );
        
        // Refetch to get the real ID
        fetchConsumption();
        return true;
      } catch (error) {
        console.error('Error inserting consumption after retries:', error);
        fetchConsumption();
        return false;
      }
    }

    const newCount = Math.max(0, current.count + delta);
    
    // Optimistic update
    setConsumption(prev => 
      prev.map(c => 
        c.participant_id === participantId && c.type === type && c.bar_id === effectiveBarId
          ? { ...c, count: newCount }
          : c
      )
    );

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Actual update with retry - build query based on whether bar_id is null or not
    try {
      await withRetry(
        async () => {
          const updateData: Record<string, unknown> = { count: newCount };
          if (subtype) updateData.subtype = subtype;
          let query = supabase
            .from('consumption')
            .update(updateData as any)
            .eq('participant_id', participantId)
            .eq('type', type);
          
          if (effectiveBarId === null) {
            query = query.is('bar_id', null);
          } else {
            query = query.eq('bar_id', effectiveBarId);
          }
          
          const { error } = await query;
          
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
      console.error('Error updating consumption after retries:', error);
      // Revert optimistic update
      fetchConsumption();
      return false;
    }
  }, [fetchConsumption]);

  const addDrink = useCallback(
    (participantId: string, barId?: number | null, subtype?: string) => updateCount(participantId, 'drink', 1, barId, subtype),
    [updateCount]
  );
  
  const removeDrink = useCallback(
    (participantId: string, barId?: number | null) => updateCount(participantId, 'drink', -1, barId),
    [updateCount]
  );
  
  const addFood = useCallback(
    (participantId: string, barId?: number | null) => updateCount(participantId, 'food', 1, barId),
    [updateCount]
  );
  
  const removeFood = useCallback(
    (participantId: string, barId?: number | null) => updateCount(participantId, 'food', -1, barId),
    [updateCount]
  );

  // Get participant consumption - optionally filtered by bar
  const getParticipantConsumption = useCallback((participantId: string, barId?: number | null) => {
    const filteredConsumption = barId !== undefined 
      ? consumption.filter(c => c.participant_id === participantId && c.bar_id === barId)
      : consumption.filter(c => c.participant_id === participantId);
    
    const drinks = filteredConsumption
      .filter(c => c.type === 'drink')
      .reduce((sum, c) => sum + c.count, 0);
    const food = filteredConsumption
      .filter(c => c.type === 'food')
      .reduce((sum, c) => sum + c.count, 0);
    
    return { drinks, food };
  }, [consumption]);

  // Get total participant consumption across all bars
  const getTotalParticipantConsumption = useCallback((participantId: string) => {
    const participantConsumption = consumption.filter(c => c.participant_id === participantId);
    const drinks = participantConsumption
      .filter(c => c.type === 'drink')
      .reduce((sum, c) => sum + c.count, 0);
    const food = participantConsumption
      .filter(c => c.type === 'food')
      .reduce((sum, c) => sum + c.count, 0);
    return { drinks, food };
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
    getTotalParticipantConsumption,
    totalDrinks,
    totalFood,
    refetch: fetchConsumption,
  };
}
