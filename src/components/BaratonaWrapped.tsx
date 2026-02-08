import { useState, useMemo } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Beer, Utensils, Trophy, Star, MapPin, Users, ChevronRight, PartyPopper, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WrappedCardProps {
  children: React.ReactNode;
  gradient: string;
  delay?: number;
  active: boolean;
}

function WrappedCard({ children, gradient, delay = 0, active }: WrappedCardProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700 ease-out",
        gradient,
        active 
          ? "opacity-100 translate-x-0 scale-100" 
          : "opacity-0 translate-x-full scale-95 pointer-events-none"
      )}
      style={{ transitionDelay: active ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function StatReveal({ value, label, icon: Icon, delay = 0 }: { 
  value: string | number; 
  label: string; 
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <div 
      className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Icon className="w-10 h-10 text-white" />
      </div>
      <span className="font-display text-5xl md:text-7xl font-black text-white drop-shadow-lg">
        {value}
      </span>
      <span className="text-white/80 text-lg font-medium">{label}</span>
    </div>
  );
}

export function BaratonaWrapped({ onClose }: { onClose?: () => void }) {
  const { 
    currentUser, 
    participants, 
    bars, 
    consumption, 
    language,
    getTotalParticipantConsumption,
    totalDrinks,
    totalFood,
    getBarVotes,
  } = useBaratona();
  
  const [currentCard, setCurrentCard] = useState(0);
  const totalCards = 6;

  // Personal stats
  const personalStats = useMemo(() => {
    if (!currentUser) return null;
    
    const myConsumption = getTotalParticipantConsumption(currentUser.id);
    
    // Find favorite bar (most consumption)
    const barConsumption = new Map<number, number>();
    consumption
      .filter(c => c.participant_id === currentUser.id && c.bar_id)
      .forEach(c => {
        const current = barConsumption.get(c.bar_id!) || 0;
        barConsumption.set(c.bar_id!, current + c.count);
      });
    
    let favoriteBarId: number | null = null;
    let maxConsumption = 0;
    barConsumption.forEach((count, barId) => {
      if (count > maxConsumption) {
        maxConsumption = count;
        favoriteBarId = barId;
      }
    });
    
    const favoriteBar = bars.find(b => b.id === favoriteBarId);
    
    return {
      drinks: myConsumption.drinks,
      food: myConsumption.food,
      favoriteBar: favoriteBar?.name || 'N/A',
    };
  }, [currentUser, consumption, bars, getTotalParticipantConsumption]);

  // Rankings
  const rankings = useMemo(() => {
    const drinkTotals = new Map<string, number>();
    const foodTotals = new Map<string, number>();
    
    consumption.forEach(c => {
      if (c.type === 'drink') {
        drinkTotals.set(c.participant_id, (drinkTotals.get(c.participant_id) || 0) + c.count);
      } else {
        foodTotals.set(c.participant_id, (foodTotals.get(c.participant_id) || 0) + c.count);
      }
    });
    
    const drinkRanking = Array.from(drinkTotals.entries())
      .map(([id, count]) => ({
        id,
        name: participants.find(p => p.id === id)?.name || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count);
    
    const foodRanking = Array.from(foodTotals.entries())
      .map(([id, count]) => ({
        id,
        name: participants.find(p => p.id === id)?.name || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count);
    
    // User's position
    const userDrinkPos = currentUser 
      ? drinkRanking.findIndex(r => r.id === currentUser.id) + 1 
      : 0;
    const userFoodPos = currentUser 
      ? foodRanking.findIndex(r => r.id === currentUser.id) + 1 
      : 0;
    
    return {
      drinkChampion: drinkRanking[0],
      foodChampion: foodRanking[0],
      userDrinkPosition: userDrinkPos || 'N/A',
      userFoodPosition: userFoodPos || 'N/A',
      drinkTop3: drinkRanking.slice(0, 3),
      foodTop3: foodRanking.slice(0, 3),
    };
  }, [consumption, participants, currentUser]);

  // Best rated bar
  const bestBar = useMemo(() => {
    let bestBarId: number | null = null;
    let bestAvg = 0;
    let bestVoteCount = 0;
    
    bars.forEach(bar => {
      const votes = getBarVotes(bar.id);
      if (votes.length > 0) {
        const avg = votes.reduce((sum, v) => 
          sum + (v.drink_score + v.food_score + v.vibe_score + v.service_score) / 4, 0
        ) / votes.length;
        
        if (avg > bestAvg || (avg === bestAvg && votes.length > bestVoteCount)) {
          bestAvg = avg;
          bestBarId = bar.id;
          bestVoteCount = votes.length;
        }
      }
    });
    
    const bar = bars.find(b => b.id === bestBarId);
    return bar ? { name: bar.name, rating: bestAvg.toFixed(1), votes: bestVoteCount } : null;
  }, [bars, getBarVotes]);

  const nextCard = () => {
    if (currentCard < totalCards - 1) {
      setCurrentCard(c => c + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(c => c - 1);
    }
  };

  const handleShare = async () => {
    const text = language === 'pt'
      ? `🍺 Baratona 2026 Wrapped!\n\nMeu consumo: ${personalStats?.drinks || 0} bebidas e ${personalStats?.food || 0} comidas\nBar favorito: ${personalStats?.favoriteBar}\n\nTotal do grupo: ${totalDrinks} bebidas! 🎉`
      : `🍺 Baratona 2026 Wrapped!\n\nMy consumption: ${personalStats?.drinks || 0} drinks and ${personalStats?.food || 0} food\nFavorite bar: ${personalStats?.favoriteBar}\n\nGroup total: ${totalDrinks} drinks! 🎉`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {/* Close button (preview mode) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Fechar"
        >
          ✕
        </button>
      )}

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {Array.from({ length: totalCards }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentCard(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i === currentCard 
                ? "bg-white w-6" 
                : i < currentCard 
                  ? "bg-white/60" 
                  : "bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Cards */}
      <div className="relative w-full h-full">
        {/* Card 0: Intro */}
        <WrappedCard 
          active={currentCard === 0} 
          gradient="bg-gradient-to-br from-primary via-primary/80 to-secondary"
        >
          <PartyPopper className="w-24 h-24 text-white mb-6 animate-bounce" />
          <h1 className="font-display text-4xl md:text-6xl font-black text-white text-center mb-4">
            Baratona 2026
          </h1>
          <p className="text-white/80 text-xl text-center mb-2">
            {language === 'pt' ? 'Seu Resumo' : 'Your Wrapped'}
          </p>
          <p className="text-white/60 text-sm">
            {language === 'pt' ? 'Toque para continuar' : 'Tap to continue'}
          </p>
        </WrappedCard>

        {/* Card 1: Personal Drinks */}
        <WrappedCard 
          active={currentCard === 1} 
          gradient="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400"
        >
          <p className="text-white/80 text-lg mb-4">
            {language === 'pt' ? 'Você bebeu' : 'You drank'}
          </p>
          <StatReveal 
            value={personalStats?.drinks || 0} 
            label={language === 'pt' ? 'bebidas' : 'drinks'} 
            icon={Beer}
            delay={200}
          />
        </WrappedCard>

        {/* Card 2: Personal Food */}
        <WrappedCard 
          active={currentCard === 2} 
          gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500"
        >
          <p className="text-white/80 text-lg mb-4">
            {language === 'pt' ? 'E comeu' : 'And ate'}
          </p>
          <StatReveal 
            value={personalStats?.food || 0} 
            label={language === 'pt' ? 'porções' : 'portions'} 
            icon={Utensils}
            delay={200}
          />
        </WrappedCard>

        {/* Card 3: Favorite Bar */}
        <WrappedCard 
          active={currentCard === 3} 
          gradient="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500"
        >
          <p className="text-white/80 text-lg mb-4">
            {language === 'pt' ? 'Seu bar favorito foi' : 'Your favorite bar was'}
          </p>
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MapPin className="w-12 h-12 text-white" />
            </div>
            <span className="font-display text-3xl md:text-5xl font-black text-white text-center drop-shadow-lg px-4">
              {personalStats?.favoriteBar || 'N/A'}
            </span>
          </div>
        </WrappedCard>

        {/* Card 4: Group Stats */}
        <WrappedCard 
          active={currentCard === 4} 
          gradient="bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400"
        >
          <p className="text-white/80 text-lg mb-6">
            {language === 'pt' ? 'Juntos, o grupo consumiu' : 'Together, the group consumed'}
          </p>
          <div className="flex gap-8">
            <StatReveal 
              value={totalDrinks} 
              label={language === 'pt' ? 'bebidas' : 'drinks'} 
              icon={Beer}
              delay={200}
            />
            <StatReveal 
              value={totalFood} 
              label={language === 'pt' ? 'comidas' : 'food'} 
              icon={Utensils}
              delay={400}
            />
          </div>
          <div className="flex items-center gap-2 mt-6 text-white/60 animate-in fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
            <Users className="w-5 h-5" />
            <span>{participants.length} {language === 'pt' ? 'participantes' : 'participants'}</span>
          </div>
        </WrappedCard>

        {/* Card 5: Champions */}
        <WrappedCard 
          active={currentCard === 5} 
          gradient="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600"
        >
          <Trophy className="w-16 h-16 text-white mb-4 animate-bounce" />
          <h2 className="font-display text-2xl font-bold text-white mb-6">
            {language === 'pt' ? 'Campeões da Baratona' : 'Baratona Champions'}
          </h2>
          
          <div className="w-full max-w-sm space-y-4">
            {/* Drink Champion */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in slide-in-from-left" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-3">
                <Beer className="w-8 h-8 text-white" />
                <div className="flex-1">
                  <p className="text-white/70 text-xs">{language === 'pt' ? 'Rei da Bebida' : 'Drink King'}</p>
                  <p className="text-white font-bold text-lg">{rankings.drinkChampion?.name || 'N/A'}</p>
                </div>
                <span className="text-white font-display text-2xl font-black">
                  {rankings.drinkChampion?.count || 0}
                </span>
              </div>
            </div>
            
            {/* Food Champion */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in slide-in-from-right" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <div className="flex items-center gap-3">
                <Utensils className="w-8 h-8 text-white" />
                <div className="flex-1">
                  <p className="text-white/70 text-xs">{language === 'pt' ? 'Rei da Comida' : 'Food King'}</p>
                  <p className="text-white font-bold text-lg">{rankings.foodChampion?.name || 'N/A'}</p>
                </div>
                <span className="text-white font-display text-2xl font-black">
                  {rankings.foodChampion?.count || 0}
                </span>
              </div>
            </div>
            
            {/* Best Bar */}
            {bestBar && (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in slide-in-from-bottom" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-white fill-white" />
                  <div className="flex-1">
                    <p className="text-white/70 text-xs">{language === 'pt' ? 'Melhor Bar' : 'Best Bar'}</p>
                    <p className="text-white font-bold text-lg">{bestBar.name}</p>
                  </div>
                  <span className="text-white font-display text-2xl font-black">
                    {bestBar.rating}⭐
                  </span>
                </div>
              </div>
            )}
          </div>
        </WrappedCard>
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-0 right-0 px-6 z-20">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={prevCard}
            disabled={currentCard === 0}
            className="text-white hover:bg-white/20 disabled:opacity-0"
          >
            {language === 'pt' ? 'Voltar' : 'Back'}
          </Button>
          
          {currentCard === totalCards - 1 ? (
            <Button
              onClick={handleShare}
              className="bg-white text-primary hover:bg-white/90 font-bold gap-2"
            >
              <Share2 className="w-4 h-4" />
              {language === 'pt' ? 'Compartilhar' : 'Share'}
            </Button>
          ) : (
            <Button
              onClick={nextCard}
              className="bg-white/20 text-white hover:bg-white/30 font-bold gap-2"
            >
              {language === 'pt' ? 'Próximo' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
