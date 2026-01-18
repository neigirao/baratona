import { useBaratona } from '@/contexts/BaratonaContext';
import { Beer, Utensils, Plus, Minus } from 'lucide-react';

export function ConsumptionCounter() {
  const { currentUser, addDrink, removeDrink, addFood, removeFood, getParticipantConsumption, t } = useBaratona();
  
  if (!currentUser) return null;
  
  const consumption = getParticipantConsumption(currentUser.id);
  
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
              onClick={() => removeDrink(currentUser.id)}
              className="counter-btn counter-btn-blue opacity-70 hover:opacity-100"
              disabled={consumption.drinks === 0}
            >
              <Minus className="w-6 h-6 text-primary-foreground" />
            </button>
            
            <span className="font-display text-3xl font-bold text-foreground min-w-[3rem] text-center">
              {consumption.drinks}
            </span>
            
            <button
              onClick={() => addDrink(currentUser.id)}
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
              onClick={() => removeFood(currentUser.id)}
              className="counter-btn counter-btn-yellow opacity-70 hover:opacity-100"
              disabled={consumption.food === 0}
            >
              <Minus className="w-6 h-6 text-secondary-foreground" />
            </button>
            
            <span className="font-display text-3xl font-bold text-foreground min-w-[3rem] text-center">
              {consumption.food}
            </span>
            
            <button
              onClick={() => addFood(currentUser.id)}
              className="counter-btn counter-btn-yellow"
            >
              <Plus className="w-6 h-6 text-secondary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
