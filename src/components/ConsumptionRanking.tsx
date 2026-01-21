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
  const { participants, t, language } = useBaratona();
  
  // Get consumption data directly from Supabase hook to have access to all participants
  const { consumption } = useConsumptionData();

  const drinkRanking = useMemo(() => {
    const drinkData = consumption
      .filter(c => c.type === 'drink' && c.count > 0)
      .map(c => ({
        participantId: c.participant_id,
        participantName: participants.find(p => p.id === c.participant_id)?.name || 'Unknown',
        count: c.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return drinkData;
  }, [consumption, participants]);

  const foodRanking = useMemo(() => {
    const foodData = consumption
      .filter(c => c.type === 'food' && c.count > 0)
      .map(c => ({
        participantId: c.participant_id,
        participantName: participants.find(p => p.id === c.participant_id)?.name || 'Unknown',
        count: c.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return foodData;
  }, [consumption, participants]);

  const hasAnyRanking = drinkRanking.length > 0 || foodRanking.length > 0;

  if (!hasAnyRanking) {
    return null;
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

// Simple hook to get consumption data directly
function useConsumptionData() {
  const { consumption } = useConsumptionHook();
  return { consumption };
}

// Import the hook from useSupabaseData
import { useConsumption as useConsumptionHook } from '@/hooks/useSupabaseData';
