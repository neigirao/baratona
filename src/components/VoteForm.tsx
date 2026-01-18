import { useState } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Beer, Utensils, Music, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ReactNode;
}

function StarRating({ value, onChange, label, icon }: StarRatingProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(30);
              onChange(star);
            }}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                star <= value 
                  ? "text-secondary fill-secondary" 
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function VoteForm() {
  const { currentUser, appConfig, submitVote, getBarVotes, t } = useBaratona();
  
  const [drinkScore, setDrinkScore] = useState(0);
  const [foodScore, setFoodScore] = useState(0);
  const [vibeScore, setVibeScore] = useState(0);
  const [serviceScore, setServiceScore] = useState(0);
  
  if (!currentUser || appConfig.status === 'in_transit') return null;
  
  // Check if user already voted for current bar
  const existingVote = getBarVotes(appConfig.currentBarId).find(
    v => v.participantName === currentUser
  );
  
  const handleSubmit = () => {
    if (drinkScore === 0 || foodScore === 0 || vibeScore === 0 || serviceScore === 0) {
      return;
    }
    
    submitVote({
      participantName: currentUser,
      barId: appConfig.currentBarId,
      drinkScore,
      foodScore,
      vibeScore,
      serviceScore,
    });
    
    // Reset form
    setDrinkScore(0);
    setFoodScore(0);
    setVibeScore(0);
    setServiceScore(0);
  };
  
  const isComplete = drinkScore > 0 && foodScore > 0 && vibeScore > 0 && serviceScore > 0;
  
  if (existingVote) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-baratona-green/50 animate-fade-in">
        <div className="text-center">
          <p className="text-sm text-baratona-green font-medium">✓ Voto registrado!</p>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="text-center">
              <Beer className="w-4 h-4 text-primary mx-auto" />
              <span className="text-xs font-bold">{existingVote.drinkScore}</span>
            </div>
            <div className="text-center">
              <Utensils className="w-4 h-4 text-secondary mx-auto" />
              <span className="text-xs font-bold">{existingVote.foodScore}</span>
            </div>
            <div className="text-center">
              <Music className="w-4 h-4 text-destructive mx-auto" />
              <span className="text-xs font-bold">{existingVote.vibeScore}</span>
            </div>
            <div className="text-center">
              <Users className="w-4 h-4 text-muted-foreground mx-auto" />
              <span className="text-xs font-bold">{existingVote.serviceScore}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-2xl p-4 border border-border animate-slide-up">
      <h3 className="text-center font-display text-sm font-semibold text-muted-foreground mb-4">
        {t.vote} - Bar Atual
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StarRating
          value={drinkScore}
          onChange={setDrinkScore}
          label={t.drink}
          icon={<Beer className="w-4 h-4" />}
        />
        <StarRating
          value={foodScore}
          onChange={setFoodScore}
          label={t.food}
          icon={<Utensils className="w-4 h-4" />}
        />
        <StarRating
          value={vibeScore}
          onChange={setVibeScore}
          label={t.vibe}
          icon={<Music className="w-4 h-4" />}
        />
        <StarRating
          value={serviceScore}
          onChange={setServiceScore}
          label={t.service}
          icon={<Users className="w-4 h-4" />}
        />
      </div>
      
      <Button
        onClick={handleSubmit}
        disabled={!isComplete}
        className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display font-bold"
      >
        Enviar Avaliação
      </Button>
    </div>
  );
}
