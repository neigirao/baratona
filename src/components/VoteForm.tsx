import { useState, useEffect } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Beer, Utensils, Music, Users, Star, Loader2, ArrowLeft, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ReactNode;
  size?: 'sm' | 'lg';
}

function StarRating({ value, onChange, label, icon, size = 'sm' }: StarRatingProps) {
  const starSize = size === 'lg' ? 'w-9 h-9' : 'w-6 h-6';
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
                starSize,
                "transition-colors",
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

interface VoteFormProps {
  barId?: number | string;
  barName?: string;
  compact?: boolean;
  isCheckedIn?: boolean;
  onNavigateToConsumption?: () => void;
}

export function VoteForm({ barId, barName, compact = false, isCheckedIn = false, onNavigateToConsumption }: VoteFormProps) {
  const { currentUser, appConfig, bars, submitVote, getUserVoteForBar, t, language, eventType } = useBaratona();
  
  const isCircuit = eventType === 'special_circuit';
  
  const [drinkScore, setDrinkScore] = useState(0);
  const [foodScore, setFoodScore] = useState(0);
  const [vibeScore, setVibeScore] = useState(0);
  const [serviceScore, setServiceScore] = useState(0);
  const [dishScore, setDishScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Use provided barId or fall back to current bar
  const effectiveBarId = barId ?? appConfig?.current_bar_id;
  
  // Find bar metadata (for featured_dish in circuit mode)
  const bar = bars.find((b) => String((b as { id: unknown }).id) === String(effectiveBarId)) as { featured_dish?: string } | undefined;
  const featuredDish = bar?.featured_dish;
  
  // Reset form when bar changes
  useEffect(() => {
    setDrinkScore(0);
    setFoodScore(0);
    setVibeScore(0);
    setServiceScore(0);
    setDishScore(0);
    setIsEditing(false);
  }, [effectiveBarId]);
  
  if (!currentUser || !effectiveBarId) return null;
  
  // Check if user already voted for this bar
  const existingVote = getUserVoteForBar(currentUser.id, effectiveBarId) as {
    dish_score?: number | null;
    drink_score?: number | null;
    food_score?: number | null;
    vibe_score?: number | null;
    service_score?: number | null;
  } | null | undefined;
  
  const handleSubmit = async () => {
    if (isCircuit) {
      if (dishScore === 0) return;
    } else {
      if (drinkScore === 0 || foodScore === 0 || vibeScore === 0 || serviceScore === 0) return;
    }
    
    setSubmitting(true);
    const success = await submitVote(currentUser.id, effectiveBarId, isCircuit
      ? { dishScore }
      : { drinkScore, foodScore, vibeScore, serviceScore }
    );
    setSubmitting(false);
    
    if (success) {
      toast({
        title: language === 'pt' ? 'Avaliação enviada!' : 'Review submitted!',
        description: language === 'pt' 
          ? 'Obrigado pelo seu feedback! 🎉' 
          : 'Thank you for your feedback! 🎉',
      });
      
      setDrinkScore(0);
      setFoodScore(0);
      setVibeScore(0);
      setServiceScore(0);
      setDishScore(0);
      setIsEditing(false);
    } else {
      toast({
        title: language === 'pt' ? 'Erro ao enviar' : 'Submit failed',
        description: language === 'pt' 
          ? 'Não foi possível enviar sua avaliação. Tente novamente.' 
          : 'Could not submit your review. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const isComplete = isCircuit
    ? dishScore > 0
    : drinkScore > 0 && foodScore > 0 && vibeScore > 0 && serviceScore > 0;
  
  // Handle entering edit mode
  const handleStartEditing = () => {
    if (existingVote) {
      if (isCircuit) {
        setDishScore(existingVote.dish_score ?? 0);
      } else {
        setDrinkScore(existingVote.drink_score ?? 0);
        setFoodScore(existingVote.food_score ?? 0);
        setVibeScore(existingVote.vibe_score ?? 0);
        setServiceScore(existingVote.service_score ?? 0);
      }
      setIsEditing(true);
    }
  };
  
  // Show existing vote with optional edit button
  if (existingVote && !isEditing) {
    return (
      <div className={cn(
        "bg-card rounded-2xl border border-baratona-green/50 animate-fade-in",
        compact ? "p-3" : "p-4"
      )}>
        <div className="text-center">
          <p className="text-sm text-baratona-green font-medium">
            ✓ {language === 'pt' ? 'Voto registrado!' : 'Vote recorded!'}
          </p>
          {isCircuit ? (
            <div className="flex items-center justify-center gap-2 mt-3">
              <ChefHat className="w-5 h-5 text-secondary" />
              <span className="text-xs text-muted-foreground">
                {featuredDish || (language === 'pt' ? 'Petisco' : 'Dish')}:
              </span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={cn("w-4 h-4", s <= (existingVote.dish_score ?? 0) ? "text-secondary fill-secondary" : "text-muted-foreground")} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <Beer className="w-4 h-4 text-primary mx-auto" />
                <span className="text-xs font-bold">{existingVote.drink_score}</span>
              </div>
              <div className="text-center">
                <Utensils className="w-4 h-4 text-secondary mx-auto" />
                <span className="text-xs font-bold">{existingVote.food_score}</span>
              </div>
              <div className="text-center">
                <Music className="w-4 h-4 text-destructive mx-auto" />
                <span className="text-xs font-bold">{existingVote.vibe_score}</span>
              </div>
              <div className="text-center">
                <Users className="w-4 h-4 text-muted-foreground mx-auto" />
                <span className="text-xs font-bold">{existingVote.service_score}</span>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-3">
            {/* Edit button - circuit mode allows edit anytime, baratona requires checkin */}
            {(isCircuit || isCheckedIn) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditing}
              >
                {language === 'pt' ? 'Editar Avaliação' : 'Edit Review'}
              </Button>
            )}
            
            {onNavigateToConsumption && !isCircuit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToConsumption}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {language === 'pt' ? 'Voltar ao Consumo' : 'Back to Consumption'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  const title = isCircuit
    ? (featuredDish
        ? `${language === 'pt' ? 'Avaliar petisco' : 'Rate dish'}: ${featuredDish}`
        : (language === 'pt' ? 'Avaliar petisco' : 'Rate dish'))
    : (barName 
        ? `${t.vote} - ${barName}`
        : `${t.vote} - ${language === 'pt' ? 'Bar Atual' : 'Current Bar'}`);
  
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border animate-slide-up",
      compact ? "p-3" : "p-4"
    )}>
      <h3 className="text-center font-display text-sm font-semibold text-muted-foreground mb-4">
        {title}
      </h3>
      
      {isCircuit ? (
        <div className="flex justify-center mb-4">
          <StarRating
            value={dishScore}
            onChange={setDishScore}
            label={language === 'pt' ? 'Nota do petisco' : 'Dish rating'}
            icon={<ChefHat className="w-4 h-4" />}
            size="lg"
          />
        </div>
      ) : (
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
      )}
      
      <Button
        onClick={handleSubmit}
        disabled={!isComplete || submitting}
        className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display font-bold"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        {language === 'pt' ? 'Enviar Avaliação' : 'Submit Review'}
      </Button>
    </div>
  );
}
