/**
 * EventBaratonaContext — provides values through the SAME BaratonaContext
 * so that existing components calling useBaratona() work transparently.
 */
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Language, TRANSLATIONS } from '@/lib/constants';
import { BaratonaContext } from '@/contexts/BaratonaContext';
import { useEventBars, useEventAppConfig, useEventVotes, useEventConsumption, useEventCheckins, useEventMembers } from '@/hooks/useEventData';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { useBaratonaComputed } from '@/hooks/useBaratonaComputed';

interface EventParticipant {
  id: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

interface Props {
  eventId: string;
  eventType?: 'open_baratona' | 'special_circuit';
  children: ReactNode;
}

export function EventBaratonaProvider({ eventId, eventType, children }: Props) {
  const { user } = usePlatformAuth();

  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('baratona_lang') as Language) || 'pt');
  useEffect(() => { localStorage.setItem('baratona_lang', language); }, [language]);
  const t = TRANSLATIONS[language];

  const { bars, loading: barsLoading, refetch: refetchBars } = useEventBars(eventId);
  const { appConfig, loading: appConfigLoading, updateConfig, refetch: refetchAppConfig } = useEventAppConfig(eventId);
  const { votes, submitVote: submitVoteRaw, getBarVotes: getBarVotesRaw, refetch: refetchVotes } = useEventVotes(eventId);
  const { members, loading: membersLoading, refetch: refetchMembers } = useEventMembers(eventId);
  const { checkins, checkIn, checkOut, isCheckedIn, getBarCheckins, refetch: refetchCheckins } = useEventCheckins(eventId);

  const currentBarId = appConfig?.current_bar_id ?? null;

  const {
    consumption, loading: consumptionLoading,
    addDrink, removeDrink, addFood, removeFood,
    updateConsumption, getParticipantConsumption,
    getTotalParticipantConsumption, totalDrinks, totalFood,
    refetch: refetchConsumption,
  } = useEventConsumption(eventId, currentBarId);

  const { secondsAgo, isRefreshing, startRefresh, endRefresh, markUpdated } = useSyncStatus();
  useEffect(() => { if (consumption.length > 0) markUpdated(); }, [consumption, markUpdated]);

  const refreshAll = useCallback(async () => {
    startRefresh();
    try {
      await Promise.all([refetchBars(), refetchAppConfig(), refetchVotes(), refetchConsumption(), refetchMembers(), refetchCheckins()]);
    } finally { endRefresh(); }
  }, [refetchBars, refetchAppConfig, refetchVotes, refetchConsumption, refetchMembers, refetchCheckins, startRefresh, endRefresh]);

  const participants = useMemo<EventParticipant[]>(() =>
    members.map(m => ({
      id: m.user_id,
      name: m.display_name || 'Participante',
      is_admin: m.role === 'event_owner',
      created_at: m.created_at,
    })),
  [members]);

  const currentUser = useMemo(() => {
    if (!user) return null;
    return participants.find(p => p.id === user.id) || null;
  }, [user, participants]);

  const isAdmin = currentUser?.is_admin || false;

  const submitVote = useCallback(async (participantId: string, barId: any, scores: { drinkScore?: number; foodScore?: number; vibeScore?: number; serviceScore?: number; dishScore?: number }) => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    return submitVoteRaw(participantId, String(barId), scores);
  }, [submitVoteRaw]);

  const getBarVotes = useCallback((barId: any) => getBarVotesRaw(String(barId)), [getBarVotesRaw]);

  const getUserVoteForBar = useCallback((participantId: string, barId: any) => {
    return votes.find(v => v.user_id === participantId && v.bar_id === String(barId));
  }, [votes]);

  const { getProjectedTime, getCurrentBar, getNextBar } = useBaratonaComputed(bars, appConfig);

  const setCurrentUser = useCallback(() => {}, []);

  // eventType comes from prop (event metadata)

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isAdmin,
    eventType,
    language,
    setLanguage,
    t,
    participants,
    participantsLoading: membersLoading,
    bars,
    barsLoading,
    appConfig,
    appConfigLoading,
    updateAppConfig: updateConfig,
    addDrink,
    removeDrink,
    addFood,
    removeFood,
    updateConsumption,
    getParticipantConsumption,
    getTotalParticipantConsumption,
    totalDrinks,
    totalFood,
    consumption,
    consumptionLoading,
    loading: consumptionLoading,
    submitVote,
    getBarVotes,
    getUserVoteForBar,
    getProjectedTime,
    getCurrentBar,
    getNextBar,
    currentBarId,
    secondsAgo,
    isRefreshing,
    refreshAll,
  }), [
    currentUser, isAdmin, language, t, participants, membersLoading,
    bars, barsLoading, appConfig, appConfigLoading, updateConfig,
    addDrink, removeDrink, addFood, removeFood, updateConsumption,
    getParticipantConsumption, getTotalParticipantConsumption,
    totalDrinks, totalFood, consumption, consumptionLoading,
    submitVote, getBarVotes, getUserVoteForBar,
    getProjectedTime, getCurrentBar, getNextBar, currentBarId,
    secondsAgo, isRefreshing, refreshAll, eventType,
  ]);

  return (
    // EventBaratonaContext feeds the same BaratonaContext interface but backed
    // by event_* tables. Bar IDs here are UUIDs (string) while the legacy
    // BaratonaContext types them as number. The cast is intentional and
    // contained: all consumers that receive IDs from this context also use
    // string comparisons (see useEventData hooks).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <BaratonaContext.Provider value={value as any}>
      {children}
    </BaratonaContext.Provider>
  );
}
