import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { withRetry } from '@/hooks/useRetry';
import { isLegacyReadOnly } from '@/lib/legacyMode';
import { toast } from 'sonner';

type Consumption = Database['public']['Tables']['consumption']['Row'];

export function useConsumption(_currentBarId?: number | null) {
  const [consumption, setConsumption] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);

  const consumptionRef = useRef<Consumption[]>(consumption);
  useEffect(() => { consumptionRef.current = consumption; }, [consumption]);

  const fetchConsumption = useCallback(async () => {
    const { data, error } = await supabase.from('consumption').select('*');
    if (!error && data) setConsumption(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConsumption();
    const channel = supabase
      .channel('consumption-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption' }, () => fetchConsumption())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConsumption]);

  const updateCount = useCallback(async (
    participantId: string,
    type: 'drink' | 'food',
    delta: number,
    barId?: number | null,
    subtype?: string
  ) => {
    if (isLegacyReadOnly()) {
      toast.info('Evento legado em modo somente leitura.');
      return false;
    }
    const effectiveBarId = barId ?? null;
    const current = consumptionRef.current.find(c =>
      c.participant_id === participantId && c.type === type && c.bar_id === effectiveBarId
    );

    if (!current) {
      const newCount = Math.max(0, delta);
      const optimistic = {
        id: crypto.randomUUID(),
        participant_id: participantId,
        type,
        count: newCount,
        bar_id: effectiveBarId,
        updated_at: new Date().toISOString(),
        subtype: subtype || null,
      } as Consumption;
      setConsumption(prev => [...prev, optimistic]);

      try {
        await withRetry(async () => {
          const insertData: Record<string, unknown> = {
            participant_id: participantId, type, count: newCount, bar_id: effectiveBarId,
          };
          if (subtype) insertData.subtype = subtype;
          const { error } = await supabase.from('consumption').insert(insertData as any);
          if (error) throw error;
          return true;
        }, { maxAttempts: 3, baseDelay: 1000 });
        fetchConsumption();
        return true;
      } catch (error) {
        console.error('Error inserting consumption after retries:', error);
        fetchConsumption();
        return false;
      }
    }

    const newCount = Math.max(0, current.count + delta);
    setConsumption(prev =>
      prev.map(c =>
        c.participant_id === participantId && c.type === type && c.bar_id === effectiveBarId
          ? { ...c, count: newCount }
          : c
      )
    );
    if ('vibrate' in navigator) navigator.vibrate(50);

    try {
      await withRetry(async () => {
        const updateData: Record<string, unknown> = { count: newCount };
        if (subtype) updateData.subtype = subtype;
        let query = supabase.from('consumption').update(updateData as any)
          .eq('participant_id', participantId).eq('type', type);
        if (effectiveBarId === null) query = query.is('bar_id', null);
        else query = query.eq('bar_id', effectiveBarId);
        const { error } = await query;
        if (error) throw error;
        return true;
      }, { maxAttempts: 3, baseDelay: 1000 });
      return true;
    } catch (error) {
      console.error('Error updating consumption after retries:', error);
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

  const getParticipantConsumption = useCallback((participantId: string, barId?: number | null) => {
    const filtered = barId !== undefined
      ? consumption.filter(c => c.participant_id === participantId && c.bar_id === barId)
      : consumption.filter(c => c.participant_id === participantId);
    const drinks = filtered.filter(c => c.type === 'drink').reduce((s, c) => s + c.count, 0);
    const food = filtered.filter(c => c.type === 'food').reduce((s, c) => s + c.count, 0);
    return { drinks, food };
  }, [consumption]);

  const getTotalParticipantConsumption = useCallback((participantId: string) => {
    const pc = consumption.filter(c => c.participant_id === participantId);
    const drinks = pc.filter(c => c.type === 'drink').reduce((s, c) => s + c.count, 0);
    const food = pc.filter(c => c.type === 'food').reduce((s, c) => s + c.count, 0);
    return { drinks, food };
  }, [consumption]);

  const totalDrinks = useMemo(() =>
    consumption.filter(c => c.type === 'drink').reduce((s, c) => s + c.count, 0),
  [consumption]);
  const totalFood = useMemo(() =>
    consumption.filter(c => c.type === 'food').reduce((s, c) => s + c.count, 0),
  [consumption]);

  return {
    consumption, loading, addDrink, removeDrink, addFood, removeFood,
    updateConsumption: updateCount, getParticipantConsumption,
    getTotalParticipantConsumption, totalDrinks, totalFood,
    refetch: fetchConsumption,
  };
}
