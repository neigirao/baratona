import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Beer, Utensils, Trophy } from 'lucide-react';

interface RankingItem {
  participantId: string;
  participantName: string;
  count: number;
}

const MEDALS = [
  { emoji: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { emoji: '🥈', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  { emoji: '🥉', color: 'text-amber-600', bg: 'bg-amber-600/10' },
];

function RankingList({ 
  items, 
  icon: Icon, 
  title,
  emptyMessage 
}: { 
  items: RankingItem[]; 
  icon: React.ElementType;
  title: string;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-2">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      {items.map((item, index) => (
        <div
          key={item.participantId}
          className={`flex items-center justify-between p-2 rounded-lg ${MEDALS[index].bg} animate-fade-in`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{MEDALS[index].emoji}</span>
            <span className="font-medium text-sm truncate max-w-[120px]">
              {item.participantName}
            </span>
          </div>
          <span className={`font-bold ${MEDALS[index].color}`}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ConsumptionRanking() {
  const { participants, t, language, consumption, loading } = useBaratona();

  // Aggregate consumption by participant and type
  const drinkRanking = useMemo(() => {
    const drinkTotals = new Map<string, number>();
    
    consumption
      .filter(c => c.type === 'drink' && c.count > 0)
      .forEach(c => {
        const current = drinkTotals.get(c.participant_id) || 0;
        drinkTotals.set(c.participant_id, current + c.count);
      });
    
    return Array.from(drinkTotals.entries())
      .map(([participantId, count]) => ({
        participantId,
        participantName: participants.find(p => p.id === participantId)?.name || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [consumption, participants]);

  const foodRanking = useMemo(() => {
    const foodTotals = new Map<string, number>();
    
    consumption
      .filter(c => c.type === 'food' && c.count > 0)
      .forEach(c => {
        const current = foodTotals.get(c.participant_id) || 0;
        foodTotals.set(c.participant_id, current + c.count);
      });
    
    return Array.from(foodTotals.entries())
      .map(([participantId, count]) => ({
        participantId,
        participantName: participants.find(p => p.id === participantId)?.name || 'Unknown',
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [consumption, participants]);

  const hasAnyRanking = drinkRanking.length > 0 || foodRanking.length > 0;

  // Loading state
  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {language === 'pt' ? 'Ranking' : 'Leaderboard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-16" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-16" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyRanking) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {language === 'pt' ? 'Ranking' : 'Leaderboard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {language === 'pt' 
                ? 'Nenhum consumo registrado ainda!' 
                : 'No consumption logged yet!'}
            </p>
            <p className="text-xs mt-1 opacity-70">
              {language === 'pt' 
                ? 'Seja o primeiro a registrar uma bebida 🍻' 
                : 'Be the first to log a drink 🍻'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {language === 'pt' ? 'Ranking' : 'Leaderboard'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <RankingList
            items={drinkRanking}
            icon={Beer}
            title={t.drink}
            emptyMessage={language === 'pt' ? 'Sem bebidas ainda' : 'No drinks yet'}
          />
          <RankingList
            items={foodRanking}
            icon={Utensils}
            title={t.food}
            emptyMessage={language === 'pt' ? 'Sem comidas ainda' : 'No food yet'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
