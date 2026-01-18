import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BARS, PARTICIPANTS, Language, TRANSLATIONS, AppConfig, TranslationStrings } from '@/lib/constants';

interface Consumption {
  participantName: string;
  drinks: number;
  food: number;
}

interface Vote {
  participantName: string;
  barId: number;
  drinkScore: number;
  foodScore: number;
  vibeScore: number;
  serviceScore: number;
}

interface BaratonaContextType {
  // User
  currentUser: string | null;
  setCurrentUser: (name: string | null) => void;
  isAdmin: boolean;
  
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
  
  // App Config
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
  
  // Consumption
  consumptions: Consumption[];
  addDrink: (participantName: string) => void;
  removeDrink: (participantName: string) => void;
  addFood: (participantName: string) => void;
  removeFood: (participantName: string) => void;
  
  // Votes
  votes: Vote[];
  submitVote: (vote: Vote) => void;
  getBarVotes: (barId: number) => Vote[];
  
  // Computed
  totalDrinks: number;
  totalFood: number;
  getProjectedTime: (scheduledTime: string) => string;
  getCurrentBar: () => typeof BARS[number] | undefined;
  getNextBar: () => typeof BARS[number] | undefined;
}

const BaratonaContext = createContext<BaratonaContextType | undefined>(undefined);

// Haptic feedback helper
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);
  }
};

export function BaratonaProvider({ children }: { children: ReactNode }) {
  // User state
  const [currentUser, setCurrentUserState] = useState<string | null>(() => {
    return localStorage.getItem('baratona_user');
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('baratona_lang') as Language) || 'pt';
  });
  
  // App config (mock - will be from Supabase)
  const [appConfig, setAppConfig] = useState<AppConfig>({
    status: 'at_bar',
    currentBarId: 1,
    globalDelayMinutes: 0,
    broadcastMsg: undefined,
  });
  
  // Consumption state (mock - will be from Supabase)
  const [consumptions, setConsumptions] = useState<Consumption[]>(() => {
    const saved = localStorage.getItem('baratona_consumptions');
    if (saved) return JSON.parse(saved);
    return PARTICIPANTS.map(name => ({ participantName: name, drinks: 0, food: 0 }));
  });
  
  // Votes state (mock - will be from Supabase)
  const [votes, setVotes] = useState<Vote[]>(() => {
    const saved = localStorage.getItem('baratona_votes');
    if (saved) return JSON.parse(saved);
    return [];
  });
  
  // Persist to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('baratona_user', currentUser);
    } else {
      localStorage.removeItem('baratona_user');
    }
  }, [currentUser]);
  
  useEffect(() => {
    localStorage.setItem('baratona_lang', language);
  }, [language]);
  
  useEffect(() => {
    localStorage.setItem('baratona_consumptions', JSON.stringify(consumptions));
  }, [consumptions]);
  
  useEffect(() => {
    localStorage.setItem('baratona_votes', JSON.stringify(votes));
  }, [votes]);
  
  const setCurrentUser = (name: string | null) => {
    setCurrentUserState(name);
  };
  
  const isAdmin = currentUser === 'Nei';
  
  const t = TRANSLATIONS[language];
  
  // Consumption functions with haptic feedback
  const addDrink = (participantName: string) => {
    triggerHaptic();
    setConsumptions(prev => 
      prev.map(c => 
        c.participantName === participantName 
          ? { ...c, drinks: c.drinks + 1 }
          : c
      )
    );
  };
  
  const removeDrink = (participantName: string) => {
    triggerHaptic();
    setConsumptions(prev => 
      prev.map(c => 
        c.participantName === participantName && c.drinks > 0
          ? { ...c, drinks: c.drinks - 1 }
          : c
      )
    );
  };
  
  const addFood = (participantName: string) => {
    triggerHaptic();
    setConsumptions(prev => 
      prev.map(c => 
        c.participantName === participantName 
          ? { ...c, food: c.food + 1 }
          : c
      )
    );
  };
  
  const removeFood = (participantName: string) => {
    triggerHaptic();
    setConsumptions(prev => 
      prev.map(c => 
        c.participantName === participantName && c.food > 0
          ? { ...c, food: c.food - 1 }
          : c
      )
    );
  };
  
  const submitVote = (vote: Vote) => {
    triggerHaptic();
    setVotes(prev => {
      // Remove existing vote for same user/bar combo
      const filtered = prev.filter(v => 
        !(v.participantName === vote.participantName && v.barId === vote.barId)
      );
      return [...filtered, vote];
    });
  };
  
  const getBarVotes = (barId: number) => {
    return votes.filter(v => v.barId === barId);
  };
  
  // Computed values
  const totalDrinks = consumptions.reduce((sum, c) => sum + c.drinks, 0);
  const totalFood = consumptions.reduce((sum, c) => sum + c.food, 0);
  
  const getProjectedTime = (scheduledTime: string): string => {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + appConfig.globalDelayMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };
  
  const getCurrentBar = () => {
    return BARS.find(b => b.id === appConfig.currentBarId);
  };
  
  const getNextBar = () => {
    const currentIndex = BARS.findIndex(b => b.id === appConfig.currentBarId);
    if (currentIndex < BARS.length - 1) {
      return BARS[currentIndex + 1];
    }
    return undefined;
  };
  
  return (
    <BaratonaContext.Provider value={{
      currentUser,
      setCurrentUser,
      isAdmin,
      language,
      setLanguage,
      t,
      appConfig,
      setAppConfig,
      consumptions,
      addDrink,
      removeDrink,
      addFood,
      removeFood,
      votes,
      submitVote,
      getBarVotes,
      totalDrinks,
      totalFood,
      getProjectedTime,
      getCurrentBar,
      getNextBar,
    }}>
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
