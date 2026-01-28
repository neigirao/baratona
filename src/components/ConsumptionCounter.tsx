import { useState, useEffect, useRef, useCallback } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Beer, Utensils, Plus, Minus, MapPin, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DRINK_TYPES = [
  { key: 'cerveja', label: 'Cerveja', emoji: '🍺' },
  { key: 'cachaca', label: 'Cachaça', emoji: '🥃' },
  { key: 'drink', label: 'Drink', emoji: '🍹' },
  { key: 'batida', label: 'Batida', emoji: '🧉' },
];

export function ConsumptionCounter() {
  const { 
    currentUser, 
    updateConsumption, 
    getParticipantConsumption, 
    getTotalParticipantConsumption,
    getCurrentBar,
    currentBarId,
    t, 
    language 
  } = useBaratona();
  
  // Local pending changes (delta from current database value)
  const [pendingDrinks, setPendingDrinks] = useState(0);
  const [pendingFood, setPendingFood] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [clickedDrinkType, setClickedDrinkType] = useState<string | null>(null);
  
  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentBar = getCurrentBar();
  
  // Get consumption for current bar and total
  const barConsumption = currentUser 
    ? getParticipantConsumption(currentUser.id, currentBarId)
    : { drinks: 0, food: 0 };
  const totalConsumption = currentUser 
    ? getTotalParticipantConsumption(currentUser.id)
    : { drinks: 0, food: 0 };
  
  const hasPendingChanges = pendingDrinks !== 0 || pendingFood !== 0;
  
  // Calculate display values (database + pending)
  const displayDrinks = barConsumption.drinks + pendingDrinks;
  const displayFood = barConsumption.food + pendingFood;
  
  // Auto-save with debounce
  const saveChanges = useCallback(async () => {
    if (!currentUser || (pendingDrinks === 0 && pendingFood === 0)) return;
    
    setIsSaving(true);
    
    try {
      const promises: Promise<boolean>[] = [];
      
      if (pendingDrinks !== 0) {
        promises.push(updateConsumption(currentUser.id, 'drink', pendingDrinks, currentBarId));
      }
      
      if (pendingFood !== 0) {
        promises.push(updateConsumption(currentUser.id, 'food', pendingFood, currentBarId));
      }
      
      const results = await Promise.all(promises);
      const allSucceeded = results.every(r => r);
      
      if (allSucceeded) {
        setPendingDrinks(0);
        setPendingFood(0);
        
        // Show visual feedback
        setShowSavedFeedback(true);
        setTimeout(() => setShowSavedFeedback(false), 1500);
        
        // Haptic feedback for save
        if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
      } else {
        throw new Error('Some updates failed');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Falha ao salvar consumo' : 'Failed to save consumption',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [pendingDrinks, pendingFood, currentUser, currentBarId, updateConsumption, language]);
  
  // Debounced auto-save effect
  useEffect(() => {
    if (hasPendingChanges && currentUser) {
      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      // Set new timer for 2 seconds
      saveTimerRef.current = setTimeout(() => {
        saveChanges();
      }, 2000);
    }
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [pendingDrinks, pendingFood, hasPendingChanges, saveChanges, currentUser]);
  
  // Early return AFTER all hooks
  if (!currentUser) return null;
  
  const handleAddDrink = (amount: number = 1, drinkTypeKey?: string) => {
    setPendingDrinks(prev => prev + amount);
    if ('vibrate' in navigator) navigator.vibrate(30);
    
    // Trigger button animation
    if (drinkTypeKey) {
      setClickedDrinkType(drinkTypeKey);
      setTimeout(() => setClickedDrinkType(null), 300);
    }
  };
  
  const handleRemoveDrink = () => {
    if (displayDrinks > 0) {
      setPendingDrinks(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };
  
  const handleAddFood = (amount: number = 1) => {
    setPendingFood(prev => prev + amount);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };
  
  const handleRemoveFood = () => {
    if (displayFood > 0) {
      setPendingFood(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };
  
  return (
    <div className="bg-card rounded-2xl p-4 border border-border animate-slide-up relative overflow-hidden">
      {/* Saved feedback overlay */}
      {showSavedFeedback && (
        <div className="absolute inset-0 bg-baratona-green/20 flex items-center justify-center z-10 animate-fade-in">
          <div className="bg-baratona-green text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold">
            <Check className="w-5 h-5" />
            {language === 'pt' ? 'Salvo!' : 'Saved!'}
          </div>
        </div>
      )}
      
      {/* Current bar indicator */}
      {currentBar && (
        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 text-primary" />
          <span>{currentBar.name}</span>
        </div>
      )}
      
      <h3 className="text-center font-display text-sm font-semibold text-muted-foreground mb-4">
        {language === 'pt' ? 'Meu Consumo Neste Bar' : 'My Consumption Here'}
      </h3>
      
      {/* Drink Type Buttons Grid */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Beer className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">{t.drink}</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mb-3">
          {DRINK_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => handleAddDrink(1, type.key)}
              className={`
                relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-150
                ${clickedDrinkType === type.key 
                  ? 'bg-primary scale-110 border-primary shadow-lg shadow-primary/40' 
                  : 'bg-primary/10 border-primary/20 hover:bg-primary/20 active:scale-95'
                }
              `}
            >
              <span className={`text-2xl transition-transform duration-150 ${clickedDrinkType === type.key ? 'scale-125' : ''}`}>
                {type.emoji}
              </span>
              <span className={`text-xs font-medium transition-colors duration-150 ${clickedDrinkType === type.key ? 'text-primary-foreground' : 'text-primary'}`}>
                {type.label}
              </span>
              {clickedDrinkType === type.key && (
                <span className="absolute -top-1 -right-1 bg-baratona-green text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in">
                  +1
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Total drinks with correction control */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">{language === 'pt' ? 'Total' : 'Total'}</span>
            <span className={`font-display text-3xl font-bold text-foreground transition-transform ${pendingDrinks !== 0 ? 'scale-110' : ''}`}>
              {displayDrinks}
            </span>
            {pendingDrinks !== 0 && (
              <span className={`text-xs font-semibold ${pendingDrinks > 0 ? 'text-baratona-green' : 'text-destructive'}`}>
                {pendingDrinks > 0 ? `+${pendingDrinks}` : pendingDrinks}
              </span>
            )}
          </div>
          
          <button
            onClick={handleRemoveDrink}
            className="counter-btn counter-btn-blue opacity-70 hover:opacity-100 w-10 h-10"
            disabled={displayDrinks === 0}
            title={language === 'pt' ? 'Corrigir (remover 1)' : 'Correct (remove 1)'}
          >
            <Minus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>
      
      <div className="border-t border-border pt-4">
        {/* Food Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium">{t.food}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemoveFood}
              className="counter-btn counter-btn-yellow opacity-70 hover:opacity-100 w-10 h-10"
              disabled={displayFood === 0}
            >
              <Minus className="w-5 h-5 text-secondary-foreground" />
            </button>
            
            <div className="flex flex-col items-center min-w-[3.5rem]">
              <span className={`font-display text-3xl font-bold text-foreground transition-transform ${pendingFood !== 0 ? 'scale-110' : ''}`}>
                {displayFood}
              </span>
              {pendingFood !== 0 && (
                <span className={`text-xs font-semibold ${pendingFood > 0 ? 'text-baratona-green' : 'text-destructive'}`}>
                  {pendingFood > 0 ? `+${pendingFood}` : pendingFood}
                </span>
              )}
            </div>
            
            <button
              onClick={() => handleAddFood(1)}
              className="counter-btn counter-btn-yellow w-10 h-10"
            >
              <Plus className="w-5 h-5 text-secondary-foreground" />
            </button>
          </div>
          
          {/* Quick add +5 button */}
          <button
            onClick={() => handleAddFood(5)}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary/10 text-secondary font-semibold hover:bg-secondary/20 transition-colors"
          >
            +5 🍴
          </button>
        </div>
      </div>
        
      {/* Auto-save indicator */}
      <div className="mt-4 flex items-center justify-center">
        {isSaving ? (
          <span className="text-xs text-muted-foreground animate-pulse">
            {language === 'pt' ? 'Salvando...' : 'Saving...'}
          </span>
        ) : hasPendingChanges ? (
          <span className="text-xs text-muted-foreground">
            {language === 'pt' ? 'Salvando automaticamente...' : 'Auto-saving...'}
          </span>
        ) : null}
      </div>
      
      {/* Total consumption summary */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Beer className="w-3 h-3" />
            <span>{language === 'pt' ? 'Total hoje:' : 'Total today:'}</span>
            <span className="font-bold text-foreground">{totalConsumption.drinks + pendingDrinks}</span>
          </div>
          <div className="flex items-center gap-1">
            <Utensils className="w-3 h-3" />
            <span className="font-bold text-foreground">{totalConsumption.food + pendingFood}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
