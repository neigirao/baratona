import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ACHIEVEMENTS } from '@/hooks/useAchievements';

export function useEventAchievements(eventId: string | null, userId: string | null | undefined) {
  const [unlockedKeys, setUnlockedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`event-achievements-${crypto.randomUUID()}`);

  useEffect(() => {
    if (!eventId || !userId) {
      setUnlockedKeys([]);
      setLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      const { data, error } = await supabase
        .from('event_achievements')
        .select('achievement_key')
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (!error && data) {
        setUnlockedKeys(data.map(r => r.achievement_key));
      }
      setLoading(false);
    };

    fetchAchievements();

    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_achievements',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const row = payload.new as { user_id: string; achievement_key: string };
          if (row.user_id === userId) {
            setUnlockedKeys(prev => [...prev, row.achievement_key]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, userId]);

  const unlockAchievement = useCallback(async (key: string, language: 'pt' | 'en' = 'pt') => {
    if (!eventId || !userId) return false;
    if (unlockedKeys.includes(key)) return false;

    const { error } = await supabase
      .from('event_achievements')
      .insert({ event_id: eventId, user_id: userId, achievement_key: key });

    if (error) return false;

    const achievement = ACHIEVEMENTS.find(a => a.key === key);
    if (achievement) {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 100]);
      toast({
        title: `${achievement.emoji} ${language === 'pt' ? 'Conquista desbloqueada!' : 'Achievement unlocked!'}`,
        description: language === 'pt' ? achievement.titlePt : achievement.titleEn,
        duration: 4000,
      });
    }
    return true;
  }, [eventId, userId, unlockedKeys]);

  const isUnlocked = useCallback((key: string) => unlockedKeys.includes(key), [unlockedKeys]);

  return { unlockedKeys, loading, unlockAchievement, isUnlocked };
}
