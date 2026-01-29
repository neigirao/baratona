import { useState, useEffect } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Beer, Utensils, Music, Users, Star, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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

interface VoteFormProps {
  barId?: number;
  barName?: string;
  compact?: boolean;
  isCheckedIn?: boolean;
  onNavigateToConsumption?: () => void;
}

export function VoteForm({ barId, barName, compact = false, isCheckedIn = false, onNavigateToConsumption }: VoteFormProps) {
  const { currentUser, appConfig, submitVote, getUserVoteForBar, t, language } = useBaratona();
  
  const [drinkScore, setDrinkScore] = useState(0);
  const [foodScore, setFoodScore] = useState(0);
  const [vibeScore, setVibeScore] = useState(0);
  const [serviceScore, setServiceScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Use provided barId or fall back to current bar
  const effectiveBarId = barId ?? appConfig?.current_bar_id;
  
  // Reset form when bar changes
  useEffect(() => {
    setDrinkScore(0);
    setFoodScore(0);
    setVibeScore(0);
    setServiceScore(0);
    setIsEditing(false);
  }, [effectiveBarId]);
  
  if (!currentUser || !effectiveBarId) return null;
  
  // Check if user already voted for this bar
  const existingVote = getUserVoteForBar(currentUser.id, effectiveBarId);
  
  const handleSubmit = async () => {
    if (drinkScore === 0 || foodScore === 0 || vibeScore === 0 || serviceScore === 0) {
      return;
    }
    
    setSubmitting(true);
    const success = await submitVote(currentUser.id, effectiveBarId, {
      drinkScore,
      foodScore,
      vibeScore,
      serviceScore,
    });
    setSubmitting(false);
    
    if (success) {
      // Success toast
      toast({
        title: language === 'pt' ? 'Avaliação enviada!' : 'Review submitted!',
        description: language === 'pt' 
          ? 'Obrigado pelo seu feedback! 🎉' 
          : 'Thank you for your feedback! 🎉',
      });
      
      // Reset form
      setDrinkScore(0);
      setFoodScore(0);
      setVibeScore(0);
      setServiceScore(0);
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
  
  const isComplete = drinkScore > 0 && foodScore > 0 && vibeScore > 0 && serviceScore > 0;
  
  // Handle entering edit mode
  const handleStartEditing = () => {
    if (existingVote) {
      setDrinkScore(existingVote.drink_score);
      setFoodScore(existingVote.food_score);
      setVibeScore(existingVote.vibe_score);
      setServiceScore(existingVote.service_score);
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
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-3">
            {/* Edit button - only show when checked in at the bar */}
            {isCheckedIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEditing}
              >
                {language === 'pt' ? 'Editar Avaliação' : 'Edit Review'}
              </Button>
            )}
            
            {/* Back to consumption button */}
            {onNavigateToConsumption && (
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
  
  const title = barName 
    ? `${t.vote} - ${barName}`
    : `${t.vote} - ${language === 'pt' ? 'Bar Atual' : 'Current Bar'}`;
  
  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border animate-slide-up",
      compact ? "p-3" : "p-4"
    )}>
      <h3 className="text-center font-display text-sm font-semibold text-muted-foreground mb-4">
        {title}
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
