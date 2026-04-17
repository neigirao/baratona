import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';

type EventBar = Database['public']['Tables']['event_bars']['Row'];
type EventAppConfig = Database['public']['Tables']['event_app_config']['Row'];
type EventVote = Database['public']['Tables']['event_votes']['Row'];
type EventConsumption = Database['public']['Tables']['event_consumption']['Row'];
type EventCheckin = Database['public']['Tables']['event_checkins']['Row'];
type EventMember = Database['public']['Tables']['event_members']['Row'];

// ── Event Bars ──────────────────────────────────────────────
export function useEventBars(eventId: string | null) {
  const [bars, setBars] = useState<EventBar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_bars')
      .select('*')
      .eq('event_id', eventId)
      .order('bar_order');
    if (!error && data) setBars(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-bars-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_bars', filter: `event_id=eq.${eventId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  return { bars, loading, refetch: fetch };
}

// ── Event App Config ────────────────────────────────────────
export function useEventAppConfig(eventId: string | null) {
  const [appConfig, setAppConfig] = useState<EventAppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_app_config')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();
    if (!error && data) setAppConfig(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-config-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_app_config', filter: `event_id=eq.${eventId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const updateConfig = useCallback(async (updates: Partial<Omit<EventAppConfig, 'id' | 'event_id' | 'updated_at'>>) => {
    if (!eventId) return false;
    const { error } = await supabase
      .from('event_app_config')
      .update(updates)
      .eq('event_id', eventId);
    if (error) { console.error('Error updating event config:', error); return false; }
    return true;
  }, [eventId]);

  return { appConfig, loading, updateConfig, refetch: fetch };
}

// ── Event Votes ─────────────────────────────────────────────
export function useEventVotes(eventId: string | null) {
  const [votes, setVotes] = useState<EventVote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_votes')
      .select('*')
      .eq('event_id', eventId);
    if (!error && data) setVotes(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-votes-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_votes', filter: `event_id=eq.${eventId}` }, () => fetch())
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
          event_id: eventId,
          user_id: userId,
          bar_id: barId,
          drink_score: scores.drinkScore ?? null,
          food_score: scores.foodScore ?? null,
          vibe_score: scores.vibeScore ?? null,
          service_score: scores.serviceScore ?? null,
          dish_score: scores.dishScore ?? null,
        };
        const { error } = await supabase
          .from('event_votes')
          .upsert(payload as any, { onConflict: 'event_id,user_id,bar_id' });
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

// ── Event Checkins ──────────────────────────────────────────
export function useEventCheckins(eventId: string | null) {
  const [checkins, setCheckins] = useState<EventCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_checkins')
      .select('*')
      .eq('event_id', eventId);
    if (!error && data) setCheckins(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-checkins-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_checkins', filter: `event_id=eq.${eventId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const checkIn = useCallback(async (userId: string, barId: string) => {
    if (!eventId) return false;
    const optimistic: EventCheckin = { id: crypto.randomUUID(), event_id: eventId, user_id: userId, bar_id: barId, checked_in_at: new Date().toISOString() };
    setCheckins(prev => [...prev, optimistic]);
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
    try {
      await withRetry(async () => {
        const { error } = await supabase.from('event_checkins').insert({ event_id: eventId, user_id: userId, bar_id: barId });
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
        const { error } = await supabase.from('event_checkins').delete().eq('event_id', eventId).eq('user_id', userId).eq('bar_id', barId);
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (e) {
      console.error('Error event check-out:', e);
      fetch();
      return false;
    }
  }, [eventId, fetch]);

  const isCheckedIn = useCallback((userId: string, barId: string) => checkins.some(c => c.user_id === userId && c.bar_id === barId), [checkins]);
  const getBarCheckins = useCallback((barId: string) => checkins.filter(c => c.bar_id === barId), [checkins]);

  return { checkins, loading, checkIn, checkOut, isCheckedIn, getBarCheckins, refetch: fetch };
}

// ── Event Consumption ───────────────────────────────────────
export function useEventConsumption(eventId: string | null, currentBarId?: string | null) {
  const [consumption, setConsumption] = useState<EventConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const consumptionRef = useRef<EventConsumption[]>(consumption);
  useEffect(() => { consumptionRef.current = consumption; }, [consumption]);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_consumption')
      .select('*')
      .eq('event_id', eventId);
    if (!error && data) setConsumption(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-consumption-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_consumption', filter: `event_id=eq.${eventId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  const updateCount = useCallback(async (
    userId: string,
    type: 'drink' | 'food',
    delta: number,
    barId?: string | null,
    subtype?: string
  ) => {
    if (!eventId) return false;
    const effectiveBarId = barId ?? null;
    const current = consumptionRef.current.find(c =>
      c.user_id === userId && c.type === type && c.bar_id === effectiveBarId
    );

    if (!current) {
      const newCount = Math.max(0, delta);
      const optimistic = {
        id: crypto.randomUUID(), event_id: eventId, user_id: userId,
        type, count: newCount, bar_id: effectiveBarId,
        updated_at: new Date().toISOString(), subtype: subtype || null,
      } as EventConsumption;
      setConsumption(prev => [...prev, optimistic]);
      try {
        await withRetry(async () => {
          const insertData: Record<string, unknown> = { event_id: eventId, user_id: userId, type, count: newCount, bar_id: effectiveBarId };
          if (subtype) insertData.subtype = subtype;
          const { error } = await supabase.from('event_consumption').insert(insertData as any);
          if (error) throw error;
        }, { maxAttempts: 3, baseDelay: 1000 });
        fetch();
        return true;
      } catch (e) {
        console.error('Error inserting event consumption:', e);
        fetch();
        return false;
      }
    }

    const newCount = Math.max(0, current.count + delta);
    setConsumption(prev =>
      prev.map(c => c.user_id === userId && c.type === type && c.bar_id === effectiveBarId ? { ...c, count: newCount } : c)
    );
    if ('vibrate' in navigator) navigator.vibrate(50);
    try {
      await withRetry(async () => {
        const updateData: Record<string, unknown> = { count: newCount };
        if (subtype) updateData.subtype = subtype;
        let query = supabase.from('event_consumption').update(updateData as any).eq('event_id', eventId).eq('user_id', userId).eq('type', type);
        if (effectiveBarId === null) query = query.is('bar_id', null);
        else query = query.eq('bar_id', effectiveBarId);
        const { error } = await query;
        if (error) throw error;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (e) {
      console.error('Error updating event consumption:', e);
      fetch();
      return false;
    }
  }, [eventId, fetch]);

  const addDrink = useCallback((userId: string, barId?: string | null, subtype?: string) => updateCount(userId, 'drink', 1, barId, subtype), [updateCount]);
  const removeDrink = useCallback((userId: string, barId?: string | null) => updateCount(userId, 'drink', -1, barId), [updateCount]);
  const addFood = useCallback((userId: string, barId?: string | null) => updateCount(userId, 'food', 1, barId), [updateCount]);
  const removeFood = useCallback((userId: string, barId?: string | null) => updateCount(userId, 'food', -1, barId), [updateCount]);

  const getParticipantConsumption = useCallback((userId: string, barId?: string | null) => {
    const filtered = barId !== undefined
      ? consumption.filter(c => c.user_id === userId && c.bar_id === barId)
      : consumption.filter(c => c.user_id === userId);
    const drinks = filtered.filter(c => c.type === 'drink').reduce((s, c) => s + c.count, 0);
    const food = filtered.filter(c => c.type === 'food').reduce((s, c) => s + c.count, 0);
    return { drinks, food };
  }, [consumption]);

  const getTotalParticipantConsumption = useCallback((userId: string) => {
    const pc = consumption.filter(c => c.user_id === userId);
    const drinks = pc.filter(c => c.type === 'drink').reduce((s, c) => s + c.count, 0);
    const food = pc.filter(c => c.type === 'food').reduce((s, c) => s + c.count, 0);
    return { drinks, food };
  }, [consumption]);

  const totalDrinks = useMemo(() => consumption.filter(c => c.type === 'drink').reduce((s, c) => s + c.count, 0), [consumption]);
  const totalFood = useMemo(() => consumption.filter(c => c.type === 'food').reduce((s, c) => s + c.count, 0), [consumption]);

  return {
    consumption, loading, addDrink, removeDrink, addFood, removeFood,
    updateConsumption: updateCount, getParticipantConsumption,
    getTotalParticipantConsumption, totalDrinks, totalFood, refetch: fetch,
  };
}

// ── Event Members ───────────────────────────────────────────
export function useEventMembers(eventId: string | null) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('event_members')
      .select('*')
      .eq('event_id', eventId);
    if (!error && data) setMembers(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-members-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_members', filter: `event_id=eq.${eventId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetch]);

  return { members, loading, refetch: fetch };
}
