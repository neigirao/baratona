import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Achievement {
  key: string;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  emoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'first_drink',
    titlePt: 'Primeiro Gole',
    titleEn: 'First Sip',
    descPt: 'Registrou sua primeira bebida!',
    descEn: 'Logged your first drink!',
    emoji: '🍺',
  },
  {
    key: 'sommelier',
    titlePt: 'Sommelier',
    titleEn: 'Sommelier',
    descPt: 'Experimentou todos os 4 tipos de bebida',
    descEn: 'Tried all 4 drink types',
    emoji: '🍷',
  },
  {
    key: 'social_butterfly',
    titlePt: 'Social Butterfly',
    titleEn: 'Social Butterfly',
    descPt: 'Fez check-in em 5+ bares',
    descEn: 'Checked in at 5+ bars',
    emoji: '🦋',
  },
  {
    key: 'food_critic',
    titlePt: 'Crítico Gastronômico',
    titleEn: 'Food Critic',
    descPt: 'Avaliou todos os bares visitados',
    descEn: 'Rated all visited bars',
    emoji: '⭐',
  },
  {
    key: 'early_bird',
    titlePt: 'Madrugador',
    titleEn: 'Early Bird',
    descPt: 'Presente no primeiro bar',
    descEn: 'Present at the first bar',
    emoji: '🌅',
  },
  {
    key: 'night_owl',
    titlePt: 'Coruja',
    titleEn: 'Night Owl',
    descPt: 'Presente no último bar',
    descEn: 'Present at the last bar',
    emoji: '🦉',
  },
  {
    key: 'balanced',
    titlePt: 'Equilibrista',
    titleEn: 'Balanced',
    descPt: 'Mesma quantidade de comida e bebida',
    descEn: 'Equal food and drink count',
    emoji: '⚖️',
  },
  {
    key: 'ten_drinks',
    titlePt: 'Dez+',
    titleEn: 'Ten Plus',
    descPt: 'Chegou a 10 bebidas',
    descEn: 'Reached 10 drinks',
    emoji: '🔟',
  },
  {
    key: 'twenty_drinks',
    titlePt: 'Lenda',
    titleEn: 'Legend',
    descPt: 'Chegou a 20 bebidas',
    descEn: 'Reached 20 drinks',
    emoji: '🏆',
  },
];

interface UnlockedAchievement {
  id: string;
  participant_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export function useAchievements(participantId: string | undefined) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch unlocked achievements
  useEffect(() => {
    if (!participantId) {
      setUnlockedAchievements([]);
      setLoading(false);
      return;
    }

    const fetchAchievements = async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('participant_id', participantId);

      if (!error && data) {
        setUnlockedAchievements(data);
      }
      setLoading(false);
    };

    fetchAchievements();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('achievements-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `participant_id=eq.${participantId}`,
        },
        (payload) => {
          setUnlockedAchievements(prev => [...prev, payload.new as UnlockedAchievement]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId]);

  // Unlock an achievement
  const unlockAchievement = useCallback(async (achievementKey: string, language: 'pt' | 'en' = 'pt') => {
    if (!participantId) return false;

    // Check if already unlocked
    if (unlockedAchievements.some(a => a.achievement_key === achievementKey)) {
      return false;
    }

    const { error } = await supabase
      .from('achievements')
      .insert({
        participant_id: participantId,
        achievement_key: achievementKey,
      });

    if (error) {
      // Likely already exists (unique constraint)
      return false;
    }

    // Show celebratory toast
    const achievement = ACHIEVEMENTS.find(a => a.key === achievementKey);
    if (achievement) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }

      toast({
        title: `${achievement.emoji} ${language === 'pt' ? 'Conquista desbloqueada!' : 'Achievement unlocked!'}`,
        description: language === 'pt' ? achievement.titlePt : achievement.titleEn,
        duration: 4000,
      });
    }

    return true;
  }, [participantId, unlockedAchievements]);

  // Check if an achievement is unlocked
  const isUnlocked = useCallback((key: string) => {
    return unlockedAchievements.some(a => a.achievement_key === key);
  }, [unlockedAchievements]);

  return {
    achievements: ACHIEVEMENTS,
    unlockedAchievements,
    loading,
    unlockAchievement,
    isUnlocked,
  };
}
