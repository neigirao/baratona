import { Beer, Utensils, Trophy, Star, MapPin, Users, PartyPopper, Medal, CheckCircle, Award, Laugh } from 'lucide-react';
import { ACHIEVEMENTS } from '@/hooks/useAchievements';
import { WrappedCard } from './WrappedCard';
import { StatReveal } from './StatReveal';
import { ConfettiEffect } from './ConfettiEffect';
import { useCountUp } from '@/hooks/useCountUp';
import { getMedalEmoji, type useWrappedData } from './useWrappedData';

type Lang = 'pt' | 'en';
type Data = ReturnType<typeof useWrappedData>;

interface CardProps {
  current: number;
  language: Lang;
  data: Data;
}

const fade = (delay = 200): React.CSSProperties => ({ animationDelay: `${delay}ms`, animationFillMode: 'both' });

export function CardIntro({ current, language }: CardProps) {
  return (
    <WrappedCard active={current === 0} gradient="bg-gradient-to-br from-primary via-primary/80 to-secondary">
      <PartyPopper className="w-24 h-24 text-white mb-6 animate-bounce" />
      <h1 className="font-display text-4xl md:text-6xl font-black text-white text-center mb-4">Baratona 2026</h1>
      <p className="text-white/80 text-xl text-center mb-2">{language === 'pt' ? 'Seu Resumo' : 'Your Wrapped'}</p>
      <p className="text-white/60 text-sm">{language === 'pt' ? 'Deslize para continuar →' : 'Swipe to continue →'}</p>
    </WrappedCard>
  );
}

export function CardPersonalDrinks({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 1} gradient="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
      <p className="text-white/80 text-lg mb-4">{language === 'pt' ? 'Você bebeu' : 'You drank'}</p>
      <StatReveal value={data.personalStats?.drinks || 0} label={language === 'pt' ? 'bebidas' : 'drinks'} icon={Beer} delay={200} active={current === 1} />
    </WrappedCard>
  );
}

export function CardPersonalFood({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 2} gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500">
      <p className="text-white/80 text-lg mb-4">{language === 'pt' ? 'E comeu' : 'And ate'}</p>
      <StatReveal value={data.personalStats?.food || 0} label={language === 'pt' ? 'porções' : 'portions'} icon={Utensils} delay={200} active={current === 2} />
    </WrappedCard>
  );
}

export function CardFavoriteBar({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 3} gradient="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500">
      <p className="text-white/80 text-lg mb-4">{language === 'pt' ? 'Seu bar favorito foi' : 'Your favorite bar was'}</p>
      <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4" style={fade()}>
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <MapPin className="w-12 h-12 text-white" />
        </div>
        <span className="font-display text-3xl md:text-5xl font-black text-white text-center drop-shadow-lg px-4">
          {data.personalStats?.favoriteBar || 'N/A'}
        </span>
      </div>
    </WrappedCard>
  );
}

export function CardRankingPosition({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 4} gradient="bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-400">
      <Medal className="w-16 h-16 text-white mb-4" />
      <h2 className="font-display text-xl font-bold text-white mb-6">{language === 'pt' ? 'Sua Posição' : 'Your Ranking'}</h2>
      <div className="w-full max-w-xs space-y-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4" style={fade(200)}>
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-white" />
            <div className="flex-1"><p className="text-white/70 text-xs">{language === 'pt' ? 'Ranking Bebidas' : 'Drink Ranking'}</p></div>
            <span className="text-3xl">{getMedalEmoji(data.rankings.userDrinkPosition)}</span>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4" style={fade(400)}>
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-white" />
            <div className="flex-1"><p className="text-white/70 text-xs">{language === 'pt' ? 'Ranking Comida' : 'Food Ranking'}</p></div>
            <span className="text-3xl">{getMedalEmoji(data.rankings.userFoodPosition)}</span>
          </div>
        </div>
      </div>
    </WrappedCard>
  );
}

function Top3Card({
  active, gradient, icon, title, list, suffix,
}: {
  active: boolean; gradient: string; icon: React.ReactNode; title: string;
  list: { id: string; name: string; count: number }[]; suffix: string;
}) {
  return (
    <WrappedCard active={active} gradient={gradient}>
      {icon}
      <h2 className="font-display text-xl font-bold text-white mb-6">{title}</h2>
      <div className="w-full max-w-xs space-y-3">
        {list.map((r, i) => (
          <div key={r.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4" style={fade(200 + i * 200)}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getMedalEmoji(i + 1)}</span>
              <div className="flex-1"><p className="text-white font-bold">{r.name}</p></div>
              <span className="text-white font-display text-xl font-black">{r.count} {suffix}</span>
            </div>
          </div>
        ))}
      </div>
    </WrappedCard>
  );
}

export function CardTopDrinkers({ current, language, data }: CardProps) {
  return (
    <Top3Card active={current === 5} gradient="bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400"
      icon={<Beer className="w-16 h-16 text-white mb-4" />}
      title={language === 'pt' ? 'Top 3 Bebedores' : 'Top 3 Drinkers'}
      list={data.rankings.drinkTop3} suffix="🍺" />
  );
}

export function CardTopEaters({ current, language, data }: CardProps) {
  return (
    <Top3Card active={current === 6} gradient="bg-gradient-to-br from-orange-600 via-orange-500 to-red-400"
      icon={<Utensils className="w-16 h-16 text-white mb-4" />}
      title={language === 'pt' ? 'Top 3 Comedores' : 'Top 3 Eaters'}
      list={data.rankings.foodTop3} suffix="🍽️" />
  );
}

export function CardPopularBar({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 7} gradient="bg-gradient-to-br from-cyan-600 via-cyan-500 to-teal-400">
      <MapPin className="w-16 h-16 text-white mb-4" />
      <h2 className="font-display text-xl font-bold text-white mb-4">{language === 'pt' ? 'Bar Mais Popular' : 'Most Popular Bar'}</h2>
      <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4" style={fade()}>
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Users className="w-12 h-12 text-white" />
        </div>
        <span className="font-display text-3xl md:text-5xl font-black text-white text-center drop-shadow-lg px-4">
          {data.mostPopularBar?.name || 'N/A'}
        </span>
        {data.mostPopularBar && (
          <p className="text-white/80 text-lg">
            {data.mostPopularBar.count} {language === 'pt' ? 'pessoas passaram por lá' : 'people visited'}
          </p>
        )}
      </div>
    </WrappedCard>
  );
}

export function CardGroupAchievements({ current, language, data }: CardProps) {
  const s = data.groupAchievementStats;
  return (
    <WrappedCard active={current === 8} gradient="bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500">
      <Award className="w-16 h-16 text-white mb-4" />
      <h2 className="font-display text-xl font-bold text-white mb-4">{language === 'pt' ? 'Conquistas do Grupo' : 'Group Achievements'}</h2>
      <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4" style={fade()}>
        <span className="font-display text-5xl md:text-7xl font-black text-white drop-shadow-lg">{s.unlocked}</span>
        <p className="text-white/80 text-lg text-center">
          {language === 'pt' ? `de ${s.total} conquistas possíveis desbloqueadas` : `of ${s.total} possible achievements unlocked`}
        </p>
        <p className="text-white/60 text-sm">
          {s.count} {language === 'pt' ? 'conquistas no total' : 'total achievements'}
        </p>
      </div>
    </WrappedCard>
  );
}

export function CardBarsVisited({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 9} gradient="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400">
      <p className="text-white/80 text-lg mb-4">{language === 'pt' ? 'Você visitou' : 'You visited'}</p>
      <StatReveal value={data.userCheckinData.count} label={language === 'pt' ? 'bares' : 'bars'} icon={MapPin} delay={200} active={current === 9} />
      {data.userCheckinData.barNames.length > 0 && (
        <div className="mt-6 w-full max-w-xs space-y-2 animate-in fade-in" style={fade(600)}>
          {data.userCheckinData.barNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
              <CheckCircle className="w-4 h-4 text-white/60 flex-shrink-0" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      )}
    </WrappedCard>
  );
}

export function CardPersonalAchievements({ current, language, data }: CardProps) {
  const a = data.achievementsData;
  return (
    <WrappedCard active={current === 10} gradient="bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500">
      <Award className="w-16 h-16 text-white mb-4" />
      <h2 className="font-display text-xl font-bold text-white mb-2">{language === 'pt' ? 'Suas Conquistas' : 'Your Achievements'}</h2>
      <p className="text-white/70 text-lg mb-6">{a.count} / {a.total}</p>
      <div className="grid grid-cols-3 gap-4 max-w-xs">
        {ACHIEVEMENTS.map((ach, i) => {
          const isUnlocked = a.unlocked.some(u => u.key === ach.key);
          return (
            <div key={ach.key} className="flex flex-col items-center gap-1 animate-in fade-in" style={fade(200 + i * 100)}>
              <span className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{ach.emoji}</span>
              <span className="text-white/60 text-[10px] text-center leading-tight">
                {language === 'pt' ? ach.titlePt : ach.titleEn}
              </span>
            </div>
          );
        })}
      </div>
    </WrappedCard>
  );
}

export function CardJokes({ current, language, data }: CardProps) {
  const animatedJokes = useCountUp(data.jokesCount, 1500, current === 11);
  return (
    <WrappedCard active={current === 11} gradient="bg-gradient-to-br from-pink-500 via-rose-500 to-red-400">
      <p className="text-white/80 text-lg mb-4">{language === 'pt' ? 'Piadas contadas' : 'Jokes told'}</p>
      <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4" style={fade()}>
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Laugh className="w-10 h-10 text-white" />
        </div>
        <span className="font-display text-5xl md:text-7xl font-black text-white drop-shadow-lg">{animatedJokes}</span>
        <span className="text-white/80 text-lg font-medium">
          {data.jokesCount === 0
            ? (language === 'pt' ? 'Nenhuma... sério? 😅' : 'None... really? 😅')
            : (language === 'pt' ? 'hahaha! 😂' : 'hahaha! 😂')}
        </span>
      </div>
    </WrappedCard>
  );
}

export function CardGroupTotals({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 12} gradient="bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400">
      <p className="text-white/80 text-lg mb-6">{language === 'pt' ? 'Juntos, o grupo consumiu' : 'Together, the group consumed'}</p>
      <div className="flex gap-8">
        <StatReveal value={data.totalDrinks} label={language === 'pt' ? 'bebidas' : 'drinks'} icon={Beer} delay={200} active={current === 12} />
        <StatReveal value={data.totalFood} label={language === 'pt' ? 'comidas' : 'food'} icon={Utensils} delay={400} active={current === 12} />
      </div>
      <div className="flex items-center gap-2 mt-6 text-white/60 animate-in fade-in" style={fade(600)}>
        <Users className="w-5 h-5" />
        <span>{data.participants.length} {language === 'pt' ? 'participantes' : 'participants'}</span>
      </div>
    </WrappedCard>
  );
}

export function CardChampions({ current, language, data }: CardProps) {
  return (
    <WrappedCard active={current === 13} gradient="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600">
      {current === 13 && <ConfettiEffect />}
      <Trophy className="w-16 h-16 text-white mb-4 animate-bounce relative z-20" />
      <h2 className="font-display text-2xl font-bold text-white mb-6 relative z-20">
        {language === 'pt' ? 'Campeões da Baratona' : 'Baratona Champions'}
      </h2>
      <div className="w-full max-w-sm space-y-4 relative z-20">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in slide-in-from-left" style={fade()}>
          <div className="flex items-center gap-3">
            <Beer className="w-8 h-8 text-white" />
            <div className="flex-1">
              <p className="text-white/70 text-xs">{language === 'pt' ? 'Rei da Bebida' : 'Drink King'}</p>
              <p className="text-white font-bold text-lg">{data.rankings.drinkChampion?.name || 'N/A'}</p>
            </div>
            <span className="text-white font-display text-2xl font-black">{data.rankings.drinkChampion?.count || 0}</span>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in slide-in-from-right" style={fade(400)}>
          <div className="flex items-center gap-3">
            <Utensils className="w-8 h-8 text-white" />
            <div className="flex-1">
              <p className="text-white/70 text-xs">{language === 'pt' ? 'Rei da Comida' : 'Food King'}</p>
              <p className="text-white font-bold text-lg">{data.rankings.foodChampion?.name || 'N/A'}</p>
            </div>
            <span className="text-white font-display text-2xl font-black">{data.rankings.foodChampion?.count || 0}</span>
          </div>
        </div>
        {data.bestBar && (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-in slide-in-from-bottom" style={fade(600)}>
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-white fill-white" />
              <div className="flex-1">
                <p className="text-white/70 text-xs">{language === 'pt' ? 'Melhor Bar' : 'Best Bar'}</p>
                <p className="text-white font-bold text-lg">{data.bestBar.name}</p>
              </div>
              <span className="text-white font-display text-2xl font-black">{data.bestBar.rating}⭐</span>
            </div>
          </div>
        )}
      </div>
    </WrappedCard>
  );
}
