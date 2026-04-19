import { useMemo, useState, useCallback } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Button } from '@/components/ui/button';
import { Beer, Utensils, Trophy, MapPin, Users, PartyPopper, Share2, Star } from 'lucide-react';
import { WrappedCard } from '@/components/wrapped/WrappedCard';
import { StatReveal } from '@/components/wrapped/StatReveal';
import { ProgressBars } from '@/components/wrapped/ProgressBars';

interface Props {
  eventName: string;
  isCircuit?: boolean;
  onClose?: () => void;
}

/**
 * Multi-event Wrapped — slimmer than the legacy 14-card version,
 * adapted to the EventBaratonaProvider data shape and circuit dish_score.
 */
export function EventWrapped({ eventName, isCircuit = false, onClose }: Props) {
  const { currentUser, participants, bars, consumption, getBarVotes, totalDrinks } = useBaratona();

  const cards = isCircuit ? 7 : 8;
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => setTouchStart(e.touches[0].clientX), []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const dx = touchStart - e.changedTouches[0].clientX;
    if (dx > 50) setCurrent((c) => Math.min(c + 1, cards - 1));
    else if (dx < -50) setCurrent((c) => Math.max(c - 1, 0));
    setTouchStart(null);
  }, [touchStart, cards]);

  const personal = useMemo(() => {
    if (!currentUser) return { drinks: 0, food: 0, favoriteBar: 'N/A' };
    const myCons = consumption.filter((c: any) => (c.user_id || c.participant_id) === currentUser.id);
    const drinks = myCons.filter((c: any) => c.type === 'drink').reduce((s: number, c: any) => s + c.count, 0);
    const food = myCons.filter((c: any) => c.type === 'food').reduce((s: number, c: any) => s + c.count, 0);
    const barMap = new Map<string, number>();
    myCons.forEach((c: any) => {
      if (!c.bar_id) return;
      barMap.set(c.bar_id, (barMap.get(c.bar_id) || 0) + c.count);
    });
    let favId: string | null = null; let max = 0;
    barMap.forEach((n, id) => { if (n > max) { max = n; favId = id; } });
    const fav = bars.find((b: any) => b.id === favId);
    return { drinks, food, favoriteBar: fav?.name || 'N/A' };
  }, [currentUser, consumption, bars]);

  const rankings = useMemo(() => {
    const drinkMap = new Map<string, number>();
    const foodMap = new Map<string, number>();
    consumption.forEach((c: any) => {
      const id = c.user_id || c.participant_id;
      const target = c.type === 'drink' ? drinkMap : foodMap;
      target.set(id, (target.get(id) || 0) + c.count);
    });
    const sortMap = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([id, count]) => ({ id, name: participants.find((p: any) => p.id === id)?.name || '?', count }))
        .sort((a, b) => b.count - a.count);
    const drinkRank = sortMap(drinkMap);
    const foodRank = sortMap(foodMap);
    const myDrinkPos = currentUser ? drinkRank.findIndex((r) => r.id === currentUser.id) + 1 : 0;
    return { drinkTop3: drinkRank.slice(0, 3), foodTop3: foodRank.slice(0, 3), myDrinkPos };
  }, [consumption, participants, currentUser]);

  // Bar champion: dish_score for circuits, 4-axis avg for baratonas
  const champion = useMemo(() => {
    let bestId: string | null = null; let bestAvg = 0; let bestVotes = 0;
    bars.forEach((bar: any) => {
      const votes = getBarVotes(bar.id);
      if (!votes.length) return;
      const avg = isCircuit
        ? (() => {
            const ds = votes.map((v: any) => v.dish_score).filter((n: any) => typeof n === 'number');
            return ds.length ? ds.reduce((s: number, n: number) => s + n, 0) / ds.length : 0;
          })()
        : votes.reduce((s: number, v: any) =>
            s + ((v.drink_score || 0) + (v.food_score || 0) + (v.vibe_score || 0) + (v.service_score || 0)) / 4, 0
          ) / votes.length;
      const relevantVotes = isCircuit
        ? votes.filter((v: any) => typeof v.dish_score === 'number').length
        : votes.length;
      if (relevantVotes > 0 && (avg > bestAvg || (avg === bestAvg && relevantVotes > bestVotes))) {
        bestAvg = avg; bestId = bar.id; bestVotes = relevantVotes;
      }
    });
    const bar = bars.find((b: any) => b.id === bestId);
    if (!bar) return null;
    return { name: bar.name, dish: bar.featured_dish, rating: bestAvg.toFixed(1), votes: bestVotes };
  }, [bars, getBarVotes, isCircuit]);

  const medal = (p: number) => p === 1 ? '🥇' : p === 2 ? '🥈' : p === 3 ? '🥉' : `${p}º`;

  const handleShare = async () => {
    const text = isCircuit
      ? `🍻 ${eventName}!\n\nMeu petisco favorito: ${champion?.name || '—'} (${champion?.dish || ''})\n\nGalera comeu/bebeu junto! 🎉`
      : `🍺 ${eventName} Wrapped!\n\nBebi ${personal.drinks}, comi ${personal.food}\nBar favorito: ${personal.favoriteBar}\n${rankings.myDrinkPos > 0 ? `🏅 ${medal(rankings.myDrinkPos)} no ranking de bebidas\n` : ''}\nTotal do grupo: ${totalDrinks} bebidas! 🎉`;
    try {
      if (navigator.share) await navigator.share({ text, title: eventName });
      else await navigator.clipboard.writeText(text);
    } catch { /* cancelled */ }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors" aria-label="Fechar">
          ✕
        </button>
      )}
      <ProgressBars totalCards={cards} currentCard={current} onNavigate={setCurrent} />

      <div className="relative w-full h-full">
        <WrappedCard active={current === 0} gradient="bg-gradient-to-br from-primary via-primary/80 to-secondary">
          <PartyPopper className="w-24 h-24 text-white mb-6 animate-bounce" />
          <h1 className="font-display text-4xl md:text-6xl font-black text-white text-center mb-4">{eventName}</h1>
          <p className="text-white/80 text-xl text-center mb-2">Seu Resumo</p>
          <p className="text-white/60 text-sm">Deslize para continuar →</p>
        </WrappedCard>

        {!isCircuit && (
          <>
            <WrappedCard active={current === 1} gradient="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
              <p className="text-white/80 text-lg mb-4">Você bebeu</p>
              <StatReveal value={personal.drinks} label="bebidas" icon={Beer} delay={200} active={current === 1} />
            </WrappedCard>

            <WrappedCard active={current === 2} gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500">
              <p className="text-white/80 text-lg mb-4">E comeu</p>
              <StatReveal value={personal.food} label="porções" icon={Utensils} delay={200} active={current === 2} />
            </WrappedCard>

            <WrappedCard active={current === 3} gradient="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500">
              <p className="text-white/80 text-lg mb-4">Seu bar favorito foi</p>
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-white" />
                </div>
                <span className="font-display text-3xl md:text-5xl font-black text-white text-center px-4">{personal.favoriteBar}</span>
              </div>
            </WrappedCard>
          </>
        )}

        {isCircuit && (
          <WrappedCard active={current === 1} gradient="bg-gradient-to-br from-secondary via-secondary/80 to-primary">
            <Utensils className="w-16 h-16 text-white mb-4" />
            <p className="text-white/80 text-lg mb-4">Você curtiu</p>
            <StatReveal value={bars.length} label="butecos no circuito" icon={MapPin} delay={200} active={current === 1} />
          </WrappedCard>
        )}

        {/* Top 3 drinkers — both flavors */}
        <WrappedCard
          active={current === (isCircuit ? 2 : 4)}
          gradient="bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400"
        >
          <Beer className="w-16 h-16 text-white mb-4" />
          <h2 className="font-display text-xl font-bold text-white mb-6">Top 3 Bebedores</h2>
          <div className="w-full max-w-xs space-y-3">
            {rankings.drinkTop3.length === 0 && (
              <p className="text-white/70 text-center text-sm">Sem dados ainda.</p>
            )}
            {rankings.drinkTop3.map((r, i) => (
              <div key={r.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{medal(i + 1)}</span>
                  <div className="flex-1"><p className="text-white font-bold">{r.name}</p></div>
                  <span className="text-white font-display text-xl font-black">{r.count} 🍺</span>
                </div>
              </div>
            ))}
          </div>
        </WrappedCard>

        <WrappedCard
          active={current === (isCircuit ? 3 : 5)}
          gradient="bg-gradient-to-br from-orange-600 via-orange-500 to-red-400"
        >
          <Utensils className="w-16 h-16 text-white mb-4" />
          <h2 className="font-display text-xl font-bold text-white mb-6">Top 3 Comedores</h2>
          <div className="w-full max-w-xs space-y-3">
            {rankings.foodTop3.length === 0 && (
              <p className="text-white/70 text-center text-sm">Sem dados ainda.</p>
            )}
            {rankings.foodTop3.map((r, i) => (
              <div key={r.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{medal(i + 1)}</span>
                  <div className="flex-1"><p className="text-white font-bold">{r.name}</p></div>
                  <span className="text-white font-display text-xl font-black">{r.count} 🍽️</span>
                </div>
              </div>
            ))}
          </div>
        </WrappedCard>

        {/* Champion bar / petisco */}
        <WrappedCard
          active={current === (isCircuit ? 4 : 6)}
          gradient="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
        >
          <Trophy className="w-16 h-16 text-white mb-4" />
          <h2 className="font-display text-xl font-bold text-white mb-4">
            {isCircuit ? 'Melhor Petisco' : 'Melhor Bar'}
          </h2>
          {champion ? (
            <div className="text-center text-white space-y-2 px-4">
              <p className="font-display text-2xl md:text-4xl font-black">{champion.name}</p>
              {isCircuit && champion.dish && <p className="text-white/90 text-base">{champion.dish}</p>}
              <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-4 py-1 mt-2">
                <Star className="w-4 h-4 fill-white" /> <span className="font-bold">{champion.rating}</span>
                <span className="text-white/70 text-xs ml-1">({champion.votes} {champion.votes === 1 ? 'voto' : 'votos'})</span>
              </div>
            </div>
          ) : (
            <p className="text-white/80 text-sm">Ninguém votou ainda.</p>
          )}
        </WrappedCard>

        {/* Closing card */}
        <WrappedCard
          active={current === cards - 1}
          gradient="bg-gradient-to-br from-primary via-secondary to-primary"
        >
          <Users className="w-16 h-16 text-white mb-4" />
          <h2 className="font-display text-3xl font-bold text-white text-center mb-2">Foi épico!</h2>
          <p className="text-white/80 text-center mb-6 px-4">
            {participants.length} {participants.length === 1 ? 'pessoa participou' : 'pessoas participaram'} de {eventName}.
          </p>
          <Button onClick={handleShare} variant="secondary" className="font-bold">
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar
          </Button>
        </WrappedCard>
      </div>
    </div>
  );
}
