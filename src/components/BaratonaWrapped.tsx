import { useState, useCallback } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, Share2 } from 'lucide-react';
import { ProgressBars } from '@/components/wrapped/ProgressBars';
import { useWrappedData, getMedalEmoji } from '@/components/wrapped/useWrappedData';
import {
  CardIntro, CardPersonalDrinks, CardPersonalFood, CardFavoriteBar,
  CardRankingPosition, CardTopDrinkers, CardTopEaters, CardPopularBar,
  CardGroupAchievements, CardBarsVisited, CardPersonalAchievements,
  CardJokes, CardGroupTotals, CardChampions,
} from '@/components/wrapped/WrappedCards';

const TOTAL_CARDS = 14;

export function BaratonaWrapped({ onClose }: { onClose?: () => void }) {
  const { language } = useBaratona();
  const data = useWrappedData();

  const [currentCard, setCurrentCard] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = touchStart - e.changedTouches[0].clientX;
    if (dx > 50) setCurrentCard(c => Math.min(c + 1, TOTAL_CARDS - 1));
    else if (dx < -50) setCurrentCard(c => Math.max(c - 1, 0));
    setTouchStart(null);
  }, [touchStart]);

  const handleShare = async () => {
    const r = data.rankings;
    const rankText = r.userDrinkPosition > 0
      ? (language === 'pt' ? `\n🏅 ${getMedalEmoji(r.userDrinkPosition)} no ranking de bebidas` : `\n🏅 ${getMedalEmoji(r.userDrinkPosition)} in drink ranking`)
      : '';
    const barsText = data.userCheckinData.count > 0
      ? (language === 'pt' ? `\n📍 Visitei ${data.userCheckinData.count} bares` : `\n📍 Visited ${data.userCheckinData.count} bars`)
      : '';
    const achievText = data.achievementsData.count > 0
      ? (language === 'pt' ? `\n🏆 ${data.achievementsData.count} conquistas desbloqueadas` : `\n🏆 ${data.achievementsData.count} achievements unlocked`)
      : '';
    const text = language === 'pt'
      ? `🍺 Baratona 2026 Wrapped!\n\nMeu consumo: ${data.personalStats?.drinks || 0} bebidas e ${data.personalStats?.food || 0} comidas\nBar favorito: ${data.personalStats?.favoriteBar}${rankText}${barsText}${achievText}\n\nTotal do grupo: ${data.totalDrinks} bebidas! 🎉`
      : `🍺 Baratona 2026 Wrapped!\n\nMy consumption: ${data.personalStats?.drinks || 0} drinks and ${data.personalStats?.food || 0} food\nFavorite bar: ${data.personalStats?.favoriteBar}${rankText}${barsText}${achievText}\n\nGroup total: ${data.totalDrinks} drinks! 🎉`;

    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const cardProps = { current: currentCard, language: language as 'pt' | 'en', data };

  return (
    <div
      className="fixed inset-0 z-[60] bg-background overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Fechar"
        >
          ✕
        </button>
      )}

      <ProgressBars totalCards={TOTAL_CARDS} currentCard={currentCard} onNavigate={setCurrentCard} />

      <div className="relative w-full h-full">
        <CardIntro {...cardProps} />
        <CardPersonalDrinks {...cardProps} />
        <CardPersonalFood {...cardProps} />
        <CardFavoriteBar {...cardProps} />
        <CardRankingPosition {...cardProps} />
        <CardTopDrinkers {...cardProps} />
        <CardTopEaters {...cardProps} />
        <CardPopularBar {...cardProps} />
        <CardGroupAchievements {...cardProps} />
        <CardBarsVisited {...cardProps} />
        <CardPersonalAchievements {...cardProps} />
        <CardJokes {...cardProps} />
        <CardGroupTotals {...cardProps} />
        <CardChampions {...cardProps} />
      </div>

      <div className="absolute bottom-8 left-0 right-0 px-6 z-20">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentCard(c => Math.max(c - 1, 0))}
            disabled={currentCard === 0}
            className="text-white hover:bg-white/20 disabled:opacity-0"
          >
            {language === 'pt' ? 'Voltar' : 'Back'}
          </Button>

          {currentCard === TOTAL_CARDS - 1 ? (
            <Button onClick={handleShare} className="bg-white text-primary hover:bg-white/90 font-bold gap-2">
              <Share2 className="w-4 h-4" />
              {language === 'pt' ? 'Compartilhar' : 'Share'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentCard(c => Math.min(c + 1, TOTAL_CARDS - 1))}
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
