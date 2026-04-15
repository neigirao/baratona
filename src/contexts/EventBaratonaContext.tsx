/**
 * EventBaratonaContext — drop-in replacement for BaratonaContext
 * that reads/writes from event_* tables parameterized by eventId.
 *
 * Components that call `useBaratona()` will transparently receive
 * data from the correct event when wrapped in <EventBaratonaProvider>.
 *
 * The key difference from the legacy context:
 *  - Bar IDs are UUIDs (string) instead of integers.
 *  - "Participants" are mapped from event_members + auth user.
 *  - All CRUD targets event_* tables.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Language, TRANSLATIONS, type TranslationStrings } from '@/lib/constants';
import { useEventBars, useEventAppConfig, useEventVotes, useEventConsumption, useEventCheckins, useEventMembers } from '@/hooks/useEventData';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import type { Database } from '@/integrations/supabase/types';

type EventBar = Database['public']['Tables']['event_bars']['Row'];
type EventAppConfig = Database['public']['Tables']['event_app_config']['Row'];
type EventMember = Database['public']['Tables']['event_members']['Row'];

// A "participant" in the event context is an EventMember mapped to look like a legacy Participant
interface EventParticipant {
  id: string;        // user_id
  name: string;      // display_name
  is_admin: boolean;  // role === 'event_owner'
  created_at: string;
}

// We re-export the same hook name so existing components work
const EventBaratonaContext = createContext<any>(undefined);

interface Props {
  eventId: string;
  children: ReactNode;
}

export function EventBaratonaProvider({ eventId, children }: Props) {
  const { user } = usePlatformAuth();

  // Language
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('baratona_lang') as Language) || 'pt');
  useEffect(() => { localStorage.setItem('baratona_lang', language); }, [language]);
  const t = TRANSLATIONS[language];

  // Data hooks
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

  // Sync
  const { secondsAgo, isRefreshing, startRefresh, endRefresh, markUpdated } = useSyncStatus();
  useEffect(() => { if (consumption.length > 0) markUpdated(); }, [consumption, markUpdated]);

  const refreshAll = useCallback(async () => {
    startRefresh();
    try {
      await Promise.all([refetchBars(), refetchAppConfig(), refetchVotes(), refetchConsumption(), refetchMembers(), refetchCheckins()]);
    } finally { endRefresh(); }
  }, [refetchBars, refetchAppConfig, refetchVotes, refetchConsumption, refetchMembers, refetchCheckins, startRefresh, endRefresh]);

  // Map members → participants (legacy shape)
  const participants = useMemo<EventParticipant[]>(() =>
    members.map(m => ({
      id: m.user_id,
      name: m.display_name || 'Participante',
      is_admin: m.role === 'event_owner',
      created_at: m.created_at,
    })),
  [members]);

  // Current user as participant
  const currentUser = useMemo(() => {
    if (!user) return null;
    return participants.find(p => p.id === user.id) || null;
  }, [user, participants]);

  const isAdmin = currentUser?.is_admin || false;

  // Wrap consumption functions to use user_id field names (event tables use user_id, legacy uses participant_id)
  // The existing components pass participant_id which in event context equals user_id — works transparently.

  // Votes wrapper: adapt barId type
  const submitVote = useCallback(async (
    participantId: string,
    barId: any,
    scores: { drinkScore: number; foodScore: number; vibeScore: number; serviceScore: number }
  ) => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    return submitVoteRaw(participantId, String(barId), scores);
  }, [submitVoteRaw]);

  const getBarVotes = useCallback((barId: any) => getBarVotesRaw(String(barId)), [getBarVotesRaw]);

  const getUserVoteForBar = useCallback((participantId: string, barId: any) => {
    return votes.find(v => v.user_id === participantId && v.bar_id === String(barId));
  }, [votes]);

  // Computed
  const getProjectedTime = useCallback((scheduledTime: string): string => {
    const delay = appConfig?.global_delay_minutes || 0;
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + delay;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }, [appConfig?.global_delay_minutes]);

  const getCurrentBar = useCallback(() => {
    if (!appConfig?.current_bar_id) return undefined;
    return bars.find(b => b.id === appConfig.current_bar_id);
  }, [appConfig, bars]);

  const getNextBar = useCallback(() => {
    const current = getCurrentBar();
    if (!current) return undefined;
    const idx = bars.findIndex(b => b.id === current.id);
    return idx < bars.length - 1 ? bars[idx + 1] : undefined;
  }, [getCurrentBar, bars]);

  // Setters (no-op for now — event mode doesn't have participant selection)
  const setCurrentUser = useCallback(() => {}, []);

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isAdmin,
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
    // Event-specific extras
    eventId,
    members,
    checkins,
    checkIn,
    checkOut,
    isCheckedIn,
    getBarCheckins,
  }), [
    currentUser, isAdmin, language, t, participants, membersLoading,
    bars, barsLoading, appConfig, appConfigLoading, updateConfig,
    addDrink, removeDrink, addFood, removeFood, updateConsumption,
    getParticipantConsumption, getTotalParticipantConsumption,
    totalDrinks, totalFood, consumption, consumptionLoading,
    submitVote, getBarVotes, getUserVoteForBar,
    getProjectedTime, getCurrentBar, getNextBar, currentBarId,
    secondsAgo, isRefreshing, refreshAll,
    eventId, members, checkins, checkIn, checkOut, isCheckedIn, getBarCheckins,
  ]);

  return (
    <EventBaratonaContext.Provider value={value}>
      {children}
    </EventBaratonaContext.Provider>
  );
}

export function useEventBaratona() {
  const context = useContext(EventBaratonaContext);
  if (context === undefined) {
    throw new Error('useEventBaratona must be used within an EventBaratonaProvider');
  }
  return context;
}
