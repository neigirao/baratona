import { useBaratona } from '@/contexts/BaratonaContext';
import { Beer, Utensils } from 'lucide-react';

export function Baratometro() {
  const { totalDrinks, totalFood, t } = useBaratona();
  
  return (
    <div className="baratometro rounded-2xl p-6 animate-fade-in">
      <h2 className="text-center font-display text-lg font-bold text-gradient-yellow mb-4">
        🍺 {t.baratometer} 🍺
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Drinks Counter */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center card-glow-blue">
              <Beer className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-lg animate-scale-in">
              {totalDrinks}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t.drink}</span>
        </div>
        
        {/* Food Counter */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center card-glow-yellow">
              <Utensils className="w-8 h-8 text-secondary" />
            </div>
            <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-lg animate-scale-in">
              {totalFood}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{t.food}</span>
        </div>
      </div>
      
      {/* Slogan */}
      <p className="text-center text-xs text-muted-foreground mt-4 italic">
        "Hoje não tem garçom parado, nem puta triste!"
      </p>
    </div>
  );
}
