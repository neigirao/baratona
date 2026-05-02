import { useEffect, useMemo, useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { useCheckins } from '@/hooks/useCheckins';
import { useAchievements, ACHIEVEMENTS } from '@/hooks/useAchievements';
import { supabase } from '@/integrations/supabase/client';

export function useWrappedData() {
  const {
    currentUser, participants, bars, consumption,
    getTotalParticipantConsumption, totalDrinks, totalFood, getBarVotes,
  } = useBaratona();
  const { checkins } = useCheckins();
  const { unlockedAchievements } = useAchievements(currentUser?.id);

  const personalStats = useMemo(() => {
    if (!currentUser) return null;
    const myConsumption = getTotalParticipantConsumption(currentUser.id);
    const barConsumption = new Map<number, number>();
    consumption
      .filter(c => c.participant_id === currentUser.id && c.bar_id)
      .forEach(c => {
        barConsumption.set(c.bar_id!, (barConsumption.get(c.bar_id!) || 0) + c.count);
      });
    let favoriteBarId: number | null = null;
    let max = 0;
    barConsumption.forEach((count, barId) => { if (count > max) { max = count; favoriteBarId = barId; } });
    const favoriteBar = bars.find(b => b.id === favoriteBarId);
    return { drinks: myConsumption.drinks, food: myConsumption.food, favoriteBar: favoriteBar?.name || 'N/A' };
  }, [currentUser, consumption, bars, getTotalParticipantConsumption]);

  const rankings = useMemo(() => {
    const drinkTotals = new Map<string, number>();
    const foodTotals = new Map<string, number>();
    consumption.forEach(c => {
      if (c.type === 'drink') drinkTotals.set(c.participant_id, (drinkTotals.get(c.participant_id) || 0) + c.count);
      else foodTotals.set(c.participant_id, (foodTotals.get(c.participant_id) || 0) + c.count);
    });
    const make = (m: Map<string, number>) => Array.from(m.entries())
      .map(([id, count]) => ({ id, name: participants.find(p => p.id === id)?.name || 'Unknown', count }))
      .sort((a, b) => b.count - a.count);
    const drinkRanking = make(drinkTotals);
    const foodRanking = make(foodTotals);
    return {
      drinkChampion: drinkRanking[0],
      foodChampion: foodRanking[0],
      userDrinkPosition: currentUser ? (drinkRanking.findIndex(r => r.id === currentUser.id) + 1) : 0,
      userFoodPosition: currentUser ? (foodRanking.findIndex(r => r.id === currentUser.id) + 1) : 0,
      drinkTop3: drinkRanking.slice(0, 3),
      foodTop3: foodRanking.slice(0, 3),
    };
  }, [consumption, participants, currentUser]);

  const userCheckinData = useMemo(() => {
    if (!currentUser) return { count: 0, barNames: [] as string[] };
    const userCheckins = checkins.filter(c => c.participant_id === currentUser.id);
    const uniqueBarIds = [...new Set(userCheckins.map(c => c.bar_id))];
    const barNames = uniqueBarIds.map(id => bars.find(b => b.id === id)?.name).filter(Boolean) as string[];
    return { count: uniqueBarIds.length, barNames };
  }, [currentUser, checkins, bars]);

  const achievementsData = useMemo(() => {
    const unlockedKeys = new Set(unlockedAchievements.map(a => a.achievement_key));
    const unlocked = ACHIEVEMENTS.filter(a => unlockedKeys.has(a.key));
    return { unlocked, total: ACHIEVEMENTS.length, count: unlocked.length };
  }, [unlockedAchievements]);

  const [groupAchievements, setGroupAchievements] = useState<{ participant_id: string; achievement_key: string }[]>([]);
  useEffect(() => {
    supabase.from('achievements').select('participant_id, achievement_key').then(({ data }) => {
      if (data) setGroupAchievements(data);
    });
  }, []);

  const groupAchievementStats = useMemo(() => {
    const uniqueKeys = new Set(groupAchievements.map(a => a.achievement_key));
    return { unlocked: uniqueKeys.size, total: ACHIEVEMENTS.length, count: groupAchievements.length };
  }, [groupAchievements]);

  const mostPopularBar = useMemo(() => {
    const map = new Map<number, Set<string>>();
    checkins.forEach(c => {
      const set = map.get(c.bar_id) || new Set();
      set.add(c.participant_id);
      map.set(c.bar_id, set);
    });
    let bestId: number | null = null; let bestCount = 0;
    map.forEach((set, barId) => { if (set.size > bestCount) { bestCount = set.size; bestId = barId; } });
    const bar = bars.find(b => b.id === bestId);
    return bar ? { name: bar.name, count: bestCount } : null;
  }, [checkins, bars]);

  const jokesCount = useMemo(() => {
    try { return parseInt(localStorage.getItem('baratona_jokes') || '0', 10) || 0; } catch { return 0; }
  }, []);

  const bestBar = useMemo(() => {
    let bestBarId: number | null = null; let bestAvg = 0; let bestVoteCount = 0;
    bars.forEach(bar => {
      const votes = getBarVotes(bar.id);
      if (votes.length > 0) {
        const avg = votes.reduce((s, v) => s + (v.drink_score + v.food_score + v.vibe_score + v.service_score) / 4, 0) / votes.length;
        if (avg > bestAvg || (avg === bestAvg && votes.length > bestVoteCount)) {
          bestAvg = avg; bestBarId = bar.id; bestVoteCount = votes.length;
        }
      }
    });
    const bar = bars.find(b => b.id === bestBarId);
    return bar ? { name: bar.name, rating: bestAvg.toFixed(1), votes: bestVoteCount } : null;
  }, [bars, getBarVotes]);

  return {
    currentUser, participants, totalDrinks, totalFood,
    personalStats, rankings, userCheckinData, achievementsData,
    groupAchievementStats, mostPopularBar, jokesCount, bestBar,
  };
}

export const getMedalEmoji = (pos: number) => {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `${pos}º`;
};
