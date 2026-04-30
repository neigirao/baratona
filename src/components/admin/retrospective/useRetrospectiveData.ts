import { useEffect, useMemo, useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { useCheckins } from '@/hooks/useCheckins';
import { supabase } from '@/integrations/supabase/client';

export const SUBTYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  cerveja: { label: 'Cerveja', emoji: '🍺' },
  cachaca: { label: 'Cachaça', emoji: '🥃' },
  drink: { label: 'Drink', emoji: '🍹' },
  batida: { label: 'Batida', emoji: '🧉' },
};

const MEDALS = ['🥇', '🥈', '🥉'];
export const getMedal = (i: number) => MEDALS[i] || `${i + 1}º`;

export function useRetrospectiveData() {
  const { participants, consumption, bars, getBarVotes } = useBaratona();
  const { checkins } = useCheckins();

  const [allAchievements, setAllAchievements] = useState<{ participant_id: string; achievement_key: string }[]>([]);
  useEffect(() => {
    supabase.from('achievements').select('participant_id, achievement_key').then(({ data }) => {
      if (data) setAllAchievements(data);
    });
  }, []);

  const drinkRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter(c => c.type === 'drink').forEach(c => {
      map.set(c.participant_id, (map.get(c.participant_id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([pid, total]) => ({ participant: participants.find(p => p.id === pid), total }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  const foodRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter(c => c.type === 'food').forEach(c => {
      map.set(c.participant_id, (map.get(c.participant_id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([pid, total]) => ({ participant: participants.find(p => p.id === pid), total }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  const achievementRanking = useMemo(() => {
    const map = new Map<string, string[]>();
    allAchievements.forEach(a => {
      const list = map.get(a.participant_id) || [];
      list.push(a.achievement_key);
      map.set(a.participant_id, list);
    });
    return Array.from(map.entries())
      .map(([pid, keys]) => ({ participant: participants.find(p => p.id === pid), keys, total: keys.length }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [allAchievements, participants]);

  const consumptionPerBar = useMemo(() => {
    const map = new Map<number, { drinks: number; food: number }>();
    consumption.forEach(c => {
      if (!c.bar_id) return;
      const entry = map.get(c.bar_id) || { drinks: 0, food: 0 };
      if (c.type === 'drink') entry.drinks += c.count;
      else entry.food += c.count;
      map.set(c.bar_id, entry);
    });
    return bars.map(bar => {
      const data = map.get(bar.id) || { drinks: 0, food: 0 };
      return { bar, ...data, total: data.drinks + data.food };
    }).sort((a, b) => b.total - a.total);
  }, [consumption, bars]);

  const checkinsPerBar = useMemo(() => {
    const map = new Map<number, Set<string>>();
    checkins.forEach(c => {
      const set = map.get(c.bar_id) || new Set();
      set.add(c.participant_id);
      map.set(c.bar_id, set);
    });
    return bars.map(bar => ({ bar, count: map.get(bar.id)?.size || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [checkins, bars]);

  const barRatings = useMemo(() => {
    return bars.map(bar => {
      const votes = getBarVotes(bar.id);
      if (votes.length === 0) return { bar, drink: 0, food: 0, vibe: 0, service: 0, avg: 0, voteCount: 0 };
      const drink = votes.reduce((s, v) => s + v.drink_score, 0) / votes.length;
      const food = votes.reduce((s, v) => s + v.food_score, 0) / votes.length;
      const vibe = votes.reduce((s, v) => s + v.vibe_score, 0) / votes.length;
      const service = votes.reduce((s, v) => s + v.service_score, 0) / votes.length;
      const avg = (drink + food + vibe + service) / 4;
      return { bar, drink, food, vibe, service, avg, voteCount: votes.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [bars, getBarVotes]);

  const bestBar = barRatings.length > 0 && barRatings[0].voteCount > 0 ? barRatings[0] : null;

  const globalAverage = useMemo(() => {
    const rated = barRatings.filter(b => b.voteCount > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((s, b) => s + b.avg, 0);
    return (sum / rated.length).toFixed(1);
  }, [barRatings]);

  const barSummary = useMemo(() => {
    return bars.map(bar => {
      const rating = barRatings.find(r => r.bar.id === bar.id) || { drink: 0, food: 0, vibe: 0, service: 0, avg: 0, voteCount: 0 };
      const cons = consumptionPerBar.find(c => c.bar.id === bar.id) || { drinks: 0, food: 0, total: 0 };
      const checkinData = checkinsPerBar.find(c => c.bar.id === bar.id) || { count: 0 };
      return {
        bar,
        avgRating: rating.avg, drinkRating: rating.drink, foodRating: rating.food,
        vibeRating: rating.vibe, serviceRating: rating.service, voteCount: rating.voteCount,
        totalDrinks: cons.drinks, totalFood: cons.food, presence: checkinData.count,
      };
    }).filter(b => b.voteCount > 0 || b.totalDrinks > 0 || b.totalFood > 0 || b.presence > 0)
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [bars, barRatings, consumptionPerBar, checkinsPerBar]);

  const subtypeRankings = useMemo(() => {
    const subtypeMap = new Map<string, Map<string, number>>();
    consumption.forEach(c => {
      if (c.type !== 'drink') return;
      const sub = (c as any).subtype as string | null;
      if (!sub) return;
      const participantMap = subtypeMap.get(sub) || new Map<string, number>();
      participantMap.set(c.participant_id, (participantMap.get(c.participant_id) || 0) + c.count);
      subtypeMap.set(sub, participantMap);
    });
    const result: { subtype: string; ranking: { participant: typeof participants[0] | undefined; total: number }[] }[] = [];
    subtypeMap.forEach((pMap, sub) => {
      const ranking = Array.from(pMap.entries())
        .map(([pid, total]) => ({ participant: participants.find(p => p.id === pid), total }))
        .filter(r => r.participant)
        .sort((a, b) => b.total - a.total);
      if (ranking.length > 0) result.push({ subtype: sub, ranking });
    });
    return result.sort((a, b) => a.subtype.localeCompare(b.subtype));
  }, [consumption, participants]);

  const fidelityRanking = useMemo(() => {
    const map = new Map<string, Set<number>>();
    checkins.forEach(c => {
      const set = map.get(c.participant_id) || new Set();
      set.add(c.bar_id);
      map.set(c.participant_id, set);
    });
    return Array.from(map.entries())
      .map(([pid, barSet]) => ({ participant: participants.find(p => p.id === pid), barsVisited: barSet.size }))
      .filter(r => r.participant)
      .sort((a, b) => b.barsVisited - a.barsVisited);
  }, [checkins, participants]);

  const { votedList, notVotedList } = useMemo(() => {
    const voterIds = new Set<string>();
    bars.forEach(bar => {
      getBarVotes(bar.id).forEach(v => voterIds.add(v.participant_id));
    });
    return {
      votedList: participants.filter(p => voterIds.has(p.id)),
      notVotedList: participants.filter(p => !voterIds.has(p.id)),
    };
  }, [participants, bars, getBarVotes]);

  const peakHours = useMemo(() => {
    const barHourMap = new Map<number, Map<number, number>>();
    checkins.forEach(c => {
      const hour = new Date(c.checked_in_at).getHours();
      const hourMap = barHourMap.get(c.bar_id) || new Map<number, number>();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      barHourMap.set(c.bar_id, hourMap);
    });
    return bars.map(bar => {
      const hourMap = barHourMap.get(bar.id);
      if (!hourMap || hourMap.size === 0) return { bar, peakHour: null as number | null, count: 0 };
      let maxHour = 0, maxCount = 0;
      hourMap.forEach((count, hour) => { if (count > maxCount) { maxCount = count; maxHour = hour; } });
      return { bar, peakHour: maxHour as number | null, count: maxCount };
    }).filter(b => b.peakHour !== null);
  }, [checkins, bars]);

  const groupStats = useMemo(() => {
    const totalDrinks = drinkRanking.reduce((s, r) => s + r.total, 0);
    const totalFood = foodRanking.reduce((s, r) => s + r.total, 0);
    const activeCount = new Set([
      ...consumption.map(c => c.participant_id),
      ...checkins.map(c => c.participant_id),
    ]).size;
    const totalVotes = bars.reduce((s, bar) => s + getBarVotes(bar.id).length, 0);
    return {
      totalParticipants: participants.length,
      activeCount,
      avgDrinks: activeCount > 0 ? (totalDrinks / activeCount).toFixed(1) : '0',
      avgFood: activeCount > 0 ? (totalFood / activeCount).toFixed(1) : '0',
      totalAchievements: allAchievements.length,
      totalVotes,
    };
  }, [drinkRanking, foodRanking, consumption, checkins, participants, bars, getBarVotes, allAchievements]);

  const { usedList, notUsedList } = useMemo(() => {
    const activeIds = new Set<string>();
    checkins.forEach(c => activeIds.add(c.participant_id));
    consumption.forEach(c => activeIds.add(c.participant_id));
    return {
      usedList: participants.filter(p => activeIds.has(p.id)),
      notUsedList: participants.filter(p => !activeIds.has(p.id)),
    };
  }, [participants, checkins, consumption]);

  const jokesCount = useMemo(() => {
    try { return parseInt(localStorage.getItem('baratona_jokes') || '0', 10); } catch { return 0; }
  }, []);

  return {
    bars, drinkRanking, foodRanking, achievementRanking,
    consumptionPerBar, checkinsPerBar, barRatings, bestBar,
    globalAverage, barSummary, subtypeRankings, fidelityRanking,
    votedList, notVotedList, peakHours, groupStats,
    usedList, notUsedList, jokesCount,
  };
}
