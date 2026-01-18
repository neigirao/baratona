import { useBaratona } from '@/contexts/BaratonaContext';
import { Beer, Utensils, Plus, Minus } from 'lucide-react';

export function ConsumptionCounter() {
  const { currentUser, consumptions, addDrink, removeDrink, addFood, removeFood, t } = useBaratona();
  
  if (!currentUser) return null;
  
  const userConsumption = consumptions.find(c => c.participantName === currentUser);
  if (!userConsumption) return null;
  
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
              onClick={() => removeDrink(currentUser)}
              className="counter-btn counter-btn-blue opacity-70 hover:opacity-100"
              disabled={userConsumption.drinks === 0}
            >
              <Minus className="w-6 h-6 text-primary-foreground" />
            </button>
            
            <span className="font-display text-3xl font-bold text-foreground min-w-[3rem] text-center">
              {userConsumption.drinks}
            </span>
            
            <button
              onClick={() => addDrink(currentUser)}
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
              onClick={() => removeFood(currentUser)}
              className="counter-btn counter-btn-yellow opacity-70 hover:opacity-100"
              disabled={userConsumption.food === 0}
            >
              <Minus className="w-6 h-6 text-secondary-foreground" />
            </button>
            
            <span className="font-display text-3xl font-bold text-foreground min-w-[3rem] text-center">
              {userConsumption.food}
            </span>
            
            <button
              onClick={() => addFood(currentUser)}
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
