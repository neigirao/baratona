import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';

type EventConsumption = Database['public']['Tables']['event_consumption']['Row'];

export function useEventConsumption(eventId: string | null, _currentBarId?: string | null) {
  const [consumption, setConsumption] = useState<EventConsumption[]>([]);
  const [loading, setLoading] = useState(true);

  const consumptionRef = useRef<EventConsumption[]>(consumption);
  useEffect(() => { consumptionRef.current = consumption; }, [consumption]);

  const fetch = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.from('event_consumption').select('*').eq('event_id', eventId);
    if (!error && data) setConsumption(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetch();
    const channel = supabase
      .channel(`event-consumption-${eventId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_consumption', filter: `event_id=eq.${eventId}` },
        () => fetch())
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
          const insertData: Record<string, unknown> = {
            event_id: eventId, user_id: userId, type, count: newCount, bar_id: effectiveBarId,
          };
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
      prev.map(c => c.user_id === userId && c.type === type && c.bar_id === effectiveBarId
        ? { ...c, count: newCount } : c)
    );
    if ('vibrate' in navigator) navigator.vibrate(50);
    try {
      await withRetry(async () => {
        const updateData: Record<string, unknown> = { count: newCount };
        if (subtype) updateData.subtype = subtype;
        let query = supabase.from('event_consumption').update(updateData as any)
          .eq('event_id', eventId).eq('user_id', userId).eq('type', type);
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
