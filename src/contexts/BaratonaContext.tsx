import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Language, TRANSLATIONS, TranslationStrings } from '@/lib/constants';
import { useParticipants, useBars, useAppConfig, useVotes, useConsumption } from '@/hooks/useSupabaseData';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];
type Bar = Database['public']['Tables']['bars']['Row'];
type AppConfigRow = Database['public']['Tables']['app_config']['Row'];

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
  
  // Consumption
  addDrink: (participantId: string) => Promise<boolean>;
  removeDrink: (participantId: string) => Promise<boolean>;
  addFood: (participantId: string) => Promise<boolean>;
  removeFood: (participantId: string) => Promise<boolean>;
  updateConsumption: (participantId: string, type: 'drink' | 'food', delta: number) => Promise<boolean>;
  getParticipantConsumption: (participantId: string) => { drinks: number; food: number };
  totalDrinks: number;
  totalFood: number;
  
  // Votes
  submitVote: (participantId: string, barId: number, scores: { drinkScore: number; foodScore: number; vibeScore: number; serviceScore: number }) => Promise<boolean>;
  getBarVotes: (barId: number) => Array<Database['public']['Tables']['votes']['Row']>;
  getUserVoteForBar: (participantId: string, barId: number) => Database['public']['Tables']['votes']['Row'] | undefined;
  
  // Computed
  getProjectedTime: (scheduledTime: string) => string;
  getCurrentBar: () => Bar | undefined;
  getNextBar: () => Bar | undefined;
}

const BaratonaContext = createContext<BaratonaContextType | undefined>(undefined);

export function BaratonaProvider({ children }: { children: ReactNode }) {
  // User state from localStorage
  const [currentUser, setCurrentUserState] = useState<Participant | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('baratona_lang') as Language) || 'pt';
  });
  
  // Supabase data hooks
  const { participants, loading: participantsLoading } = useParticipants();
  const { bars, loading: barsLoading } = useBars();
  const { appConfig, loading: appConfigLoading, updateConfig } = useAppConfig();
  const { votes, submitVote: submitVoteToDb, getBarVotes } = useVotes();
  const { 
    addDrink, 
    removeDrink, 
    addFood, 
    removeFood, 
    updateConsumption,
    getParticipantConsumption,
    totalDrinks,
    totalFood,
  } = useConsumption();

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
    } else {
      localStorage.removeItem('baratona_user');
    }
  }, []);
  
  const isAdmin = currentUser?.is_admin || false;
  const t = TRANSLATIONS[language];
  
  const submitVote = useCallback(async (
    participantId: string, 
    barId: number, 
    scores: { drinkScore: number; foodScore: number; vibeScore: number; serviceScore: number }
  ) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    return submitVoteToDb(participantId, barId, scores);
  }, [submitVoteToDb]);

  const getUserVoteForBar = useCallback((participantId: string, barId: number) => {
    return votes.find(v => v.participant_id === participantId && v.bar_id === barId);
  }, [votes]);
  
  const getProjectedTime = useCallback((scheduledTime: string): string => {
    const delay = appConfig?.global_delay_minutes || 0;
    // scheduledTime is in format "HH:MM:SS"
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + delay;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }, [appConfig?.global_delay_minutes]);
  
  const getCurrentBar = useCallback(() => {
    if (!appConfig) return undefined;
    return bars.find(b => b.id === appConfig.current_bar_id);
  }, [appConfig, bars]);
  
  const getNextBar = useCallback(() => {
    if (!appConfig) return undefined;
    const current = bars.find(b => b.id === appConfig.current_bar_id);
    if (!current) return undefined;
    const currentIndex = bars.findIndex(b => b.id === current.id);
    if (currentIndex < bars.length - 1) {
      return bars[currentIndex + 1];
    }
    return undefined;
  }, [appConfig, bars]);
  
  const value = useMemo<BaratonaContextType>(() => ({
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
    updateAppConfig: updateConfig,
    addDrink,
    removeDrink,
    addFood,
    removeFood,
    updateConsumption,
    getParticipantConsumption,
    totalDrinks,
    totalFood,
    submitVote,
    getBarVotes,
    getUserVoteForBar,
    getProjectedTime,
    getCurrentBar,
    getNextBar,
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
    totalDrinks,
    totalFood,
    submitVote,
    getBarVotes,
    getUserVoteForBar,
    getProjectedTime,
    getCurrentBar,
    getNextBar,
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
