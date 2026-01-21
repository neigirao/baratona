import { useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Beer, Utensils, Plus, Minus, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ConsumptionCounter() {
  const { currentUser, addDrink, removeDrink, addFood, removeFood, getParticipantConsumption, t, language } = useBaratona();
  
  // Local pending changes (delta from current database value)
  const [pendingDrinks, setPendingDrinks] = useState(0);
  const [pendingFood, setPendingFood] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!currentUser) return null;
  
  const consumption = getParticipantConsumption(currentUser.id);
  const hasPendingChanges = pendingDrinks !== 0 || pendingFood !== 0;
  
  // Calculate display values (database + pending)
  const displayDrinks = consumption.drinks + pendingDrinks;
  const displayFood = consumption.food + pendingFood;
  
  const handleAddDrink = () => {
    setPendingDrinks(prev => prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };
  
  const handleRemoveDrink = () => {
    if (displayDrinks > 0) {
      setPendingDrinks(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };
  
  const handleAddFood = () => {
    setPendingFood(prev => prev + 1);
    if ('vibrate' in navigator) navigator.vibrate(30);
  };
  
  const handleRemoveFood = () => {
    if (displayFood > 0) {
      setPendingFood(prev => prev - 1);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };
  
  const handleSave = async () => {
    if (!hasPendingChanges) return;
    
    setIsSaving(true);
    
    // Haptic feedback for save
    if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
    
    try {
      // Apply pending changes to database
      const promises: Promise<boolean>[] = [];
      
      if (pendingDrinks > 0) {
        for (let i = 0; i < pendingDrinks; i++) {
          promises.push(addDrink(currentUser.id));
        }
      } else if (pendingDrinks < 0) {
        for (let i = 0; i < Math.abs(pendingDrinks); i++) {
          promises.push(removeDrink(currentUser.id));
        }
      }
      
      if (pendingFood > 0) {
        for (let i = 0; i < pendingFood; i++) {
          promises.push(addFood(currentUser.id));
        }
      } else if (pendingFood < 0) {
        for (let i = 0; i < Math.abs(pendingFood); i++) {
          promises.push(removeFood(currentUser.id));
        }
      }
      
      await Promise.all(promises);
      
      // Clear pending changes
      setPendingDrinks(0);
      setPendingFood(0);
      
      toast({
        title: language === 'pt' ? 'Salvo!' : 'Saved!',
        description: language === 'pt' ? 'Consumo atualizado com sucesso' : 'Consumption updated successfully',
      });
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'Falha ao salvar consumo' : 'Failed to save consumption',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-card rounded-2xl p-4 border border-border animate-slide-up">
      <h3 className="text-center font-display text-sm font-semibold text-muted-foreground mb-4">
        Meu Consumo
      </h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Drinks */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Beer className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{t.drink}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRemoveDrink}
              className="counter-btn counter-btn-blue opacity-70 hover:opacity-100"
              disabled={displayDrinks === 0}
            >
              <Minus className="w-6 h-6 text-primary-foreground" />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="font-display text-3xl font-bold text-foreground min-w-[3rem] text-center">
                {displayDrinks}
              </span>
              {pendingDrinks !== 0 && (
                <span className={`text-xs font-semibold ${pendingDrinks > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pendingDrinks > 0 ? `+${pendingDrinks}` : pendingDrinks}
                </span>
              )}
            </div>
            
            <button
              onClick={handleAddDrink}
              className="counter-btn counter-btn-blue"
            >
              <Plus className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        </div>
        
        {/* Food */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-secondary" />
            <span className="text-sm font-medium">{t.food}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRemoveFood}
              className="counter-btn counter-btn-yellow opacity-70 hover:opacity-100"
              disabled={displayFood === 0}
            >
              <Minus className="w-6 h-6 text-secondary-foreground" />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="font-display text-3xl font-bold text-foreground min-w-[3rem] text-center">
                {displayFood}
              </span>
              {pendingFood !== 0 && (
                <span className={`text-xs font-semibold ${pendingFood > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pendingFood > 0 ? `+${pendingFood}` : pendingFood}
                </span>
              )}
            </div>
            
            <button
              onClick={handleAddFood}
              className="counter-btn counter-btn-yellow"
            >
              <Plus className="w-6 h-6 text-secondary-foreground" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={!hasPendingChanges || isSaving}
          className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
            hasPendingChanges
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Save className="w-5 h-5" />
          {isSaving 
            ? (language === 'pt' ? 'Salvando...' : 'Saving...') 
            : (language === 'pt' ? 'Salvar' : 'Save')}
          {hasPendingChanges && (
            <span className="ml-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs">
              {Math.abs(pendingDrinks) + Math.abs(pendingFood)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
