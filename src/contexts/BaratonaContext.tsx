import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Language, TRANSLATIONS, TranslationStrings } from '@/lib/constants';
import { useParticipants, useBars, useAppConfig, useVotes, useConsumption } from '@/hooks/useSupabaseData';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useBaratonaComputed } from '@/hooks/useBaratonaComputed';
import { useCheckins } from '@/hooks/useCheckins';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];
type Bar = Database['public']['Tables']['bars']['Row'];
type AppConfigRow = Database['public']['Tables']['app_config']['Row'];
type Consumption = Database['public']['Tables']['consumption']['Row'];
interface BaratonaContextType {
  // User
  currentUser: Participant | null;
  setCurrentUser: (participant: Participant | null) => void;
  isAdmin: boolean;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
  
  // Data from Supabase
  participants: Participant[];
  participantsLoading: boolean;
  
  bars: Bar[];
  barsLoading: boolean;
  
  appConfig: AppConfigRow | null;
  appConfigLoading: boolean;
  updateAppConfig: (updates: Partial<Omit<AppConfigRow, 'id' | 'updated_at'>>) => Promise<boolean>;
  
  // Consumption - now with bar_id support
  addDrink: (participantId: string, barId?: number | null, subtype?: string) => Promise<boolean>;
  removeDrink: (participantId: string, barId?: number | null) => Promise<boolean>;
  addFood: (participantId: string, barId?: number | null) => Promise<boolean>;
  removeFood: (participantId: string, barId?: number | null) => Promise<boolean>;
  updateConsumption: (participantId: string, type: 'drink' | 'food', delta: number, barId?: number | null, subtype?: string) => Promise<boolean>;
  getParticipantConsumption: (participantId: string, barId?: number | null) => { drinks: number; food: number };
  getTotalParticipantConsumption: (participantId: string) => { drinks: number; food: number };
  totalDrinks: number;
  totalFood: number;
  consumption: Consumption[];
  consumptionLoading: boolean;
  
  // Votes
  submitVote: (participantId: string, barId: number | string, scores: { drinkScore?: number; foodScore?: number; vibeScore?: number; serviceScore?: number; dishScore?: number }) => Promise<boolean>;
  getBarVotes: (barId: number | string) => Array<Database['public']['Tables']['votes']['Row']>;
  getUserVoteForBar: (participantId: string, barId: number | string) => (Database['public']['Tables']['votes']['Row'] & { dish_score?: number | null }) | undefined;
  
  // Computed
  getProjectedTime: (scheduledTime: string) => string;
  getCurrentBar: () => Bar | undefined;
  getNextBar: () => Bar | undefined;
  currentBarId: number | null;
  
  // Sync status
  secondsAgo: number;
  isRefreshing: boolean;
  refreshAll: () => Promise<void>;
  
  // Loading alias for general components
  loading: boolean;

  // Check-ins
  checkIn: (participantId: string, barId: any) => Promise<boolean>;
  checkOut: (participantId: string, barId: any) => Promise<boolean>;
  isCheckedIn: (participantId: string, barId: any) => boolean;
  getBarCheckins: (barId: any) => Array<{ participant_id: string; bar_id: any; checked_in_at: string }>;

  // Event type (for multi-event platform). Defaults to 'open_baratona' for legacy.
  eventType?: 'open_baratona' | 'special_circuit';
}

export const BaratonaContext = createContext<BaratonaContextType | undefined>(undefined);

export function BaratonaProvider({ children }: { children: ReactNode }) {
  // User state from localStorage
  const [currentUser, setCurrentUserState] = useState<Participant | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('baratona_lang') as Language) || 'pt';
  });
  
  // Supabase data hooks
  const { participants, loading: participantsLoading, refetch: refetchParticipants } = useParticipants();
  const { bars, loading: barsLoading, refetch: refetchBars } = useBars();
  const { appConfig, loading: appConfigLoading, updateConfig, refetch: refetchAppConfig } = useAppConfig();
  const { votes, submitVote: submitVoteToDb, getBarVotes, refetch: refetchVotes } = useVotes();
  const { checkIn, checkOut, isCheckedIn, getBarCheckins } = useCheckins();
  
  // Sync status
  const { secondsAgo, isRefreshing, startRefresh, endRefresh, markUpdated } = useSyncStatus();
  
  // Get current bar ID from app config
  const currentBarId = appConfig?.current_bar_id ?? null;
  
  const { 
    consumption,
    loading: consumptionLoading,
    addDrink, 
    removeDrink, 
    addFood, 
    removeFood, 
    updateConsumption,
    getParticipantConsumption,
    getTotalParticipantConsumption,
    totalDrinks,
    totalFood,
    refetch: refetchConsumption,
  } = useConsumption(currentBarId);
  
  // Mark updated when consumption changes (real-time updates)
  useEffect(() => {
    if (consumption.length > 0) {
      markUpdated();
    }
  }, [consumption, markUpdated]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    startRefresh();
    try {
      await Promise.all([
        refetchParticipants(),
        refetchBars(),
        refetchAppConfig(),
        refetchVotes(),
        refetchConsumption(),
      ]);
    } finally {
      endRefresh();
    }
  }, [refetchParticipants, refetchBars, refetchAppConfig, refetchVotes, refetchConsumption, startRefresh, endRefresh]);

  // Restore user from localStorage
  useEffect(() => {
    const savedUserName = localStorage.getItem('baratona_user');
    if (savedUserName && participants.length > 0) {
      const foundUser = participants.find(p => p.name === savedUserName);
      if (foundUser) {
        setCurrentUserState(foundUser);
      }
    }
  }, [participants]);
  
  // Persist language to localStorage
  useEffect(() => {
    localStorage.setItem('baratona_lang', language);
  }, [language]);
  
  const setCurrentUser = useCallback((participant: Participant | null) => {
    setCurrentUserState(participant);
    if (participant) {
      localStorage.setItem('baratona_user', participant.name);
      // Store last used participant for sorting
      const lastUsed = JSON.parse(localStorage.getItem('baratona_last_used') || '{}');
      lastUsed[participant.id] = Date.now();
      localStorage.setItem('baratona_last_used', JSON.stringify(lastUsed));
    } else {
      localStorage.removeItem('baratona_user');
    }
  }, []);
  
  const isAdmin = currentUser?.is_admin || false;
  const t = TRANSLATIONS[language];
  
  const submitVote = useCallback(async (
    participantId: string,
    barId: number | string,
    scores: { drinkScore?: number; foodScore?: number; vibeScore?: number; serviceScore?: number; dishScore?: number }
  ) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    // Legacy uses 4 dimensions only — coerce to 0 if missing (legacy schema requires NOT NULL)
    return submitVoteToDb(participantId, Number(barId), {
      drinkScore: scores.drinkScore ?? 0,
      foodScore: scores.foodScore ?? 0,
      vibeScore: scores.vibeScore ?? 0,
      serviceScore: scores.serviceScore ?? 0,
    });
  }, [submitVoteToDb]);

  const getUserVoteForBar = useCallback((participantId: string, barId: number | string) => {
    return votes.find(v => v.participant_id === participantId && v.bar_id === Number(barId));
  }, [votes]);
  
  const { getProjectedTime, getCurrentBar, getNextBar } = useBaratonaComputed(bars, appConfig);
  
  const value = useMemo<BaratonaContextType>(() => ({
    currentUser,
    setCurrentUser,
    isAdmin,
    eventType: 'open_baratona',
    language,
    setLanguage,
    t,
    participants,
    participantsLoading,
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
    checkIn,
    checkOut,
    isCheckedIn,
    getBarCheckins,
  }), [
    currentUser,
    setCurrentUser,
    isAdmin,
    language,
    setLanguage,
    t,
    participants,
    participantsLoading,
    bars,
    barsLoading,
    appConfig,
    appConfigLoading,
    updateConfig,
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
    checkIn,
    checkOut,
    isCheckedIn,
    getBarCheckins,
  ]);

  return (
    <BaratonaContext.Provider value={value}>
      {children}
    </BaratonaContext.Provider>
  );
}

export function useBaratona() {
  const context = useContext(BaratonaContext);
  if (context === undefined) {
    throw new Error('useBaratona must be used within a BaratonaProvider');
  }
  return context;
}
