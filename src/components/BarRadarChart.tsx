import { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useBaratona } from '@/contexts/BaratonaContext';

interface BarRadarChartProps {
  barId: number;
}

export function BarRadarChart({ barId }: BarRadarChartProps) {
  const { getBarVotes, t } = useBaratona();
  
  const chartData = useMemo(() => {
    const votes = getBarVotes(barId);
    
    if (votes.length === 0) {
      return null;
    }
    
    const avgDrink = votes.reduce((sum, v) => sum + v.drink_score, 0) / votes.length;
    const avgFood = votes.reduce((sum, v) => sum + v.food_score, 0) / votes.length;
    const avgVibe = votes.reduce((sum, v) => sum + v.vibe_score, 0) / votes.length;
    const avgService = votes.reduce((sum, v) => sum + v.service_score, 0) / votes.length;
    
    return [
      { category: t.drink, value: avgDrink, fullMark: 5 },
      { category: t.food, value: avgFood, fullMark: 5 },
      { category: t.vibe, value: avgVibe, fullMark: 5 },
      { category: t.service, value: avgService, fullMark: 5 },
    ];
  }, [barId, getBarVotes, t]);
  
  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhuma avaliação ainda
      </div>
    );
  }
  
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 5]} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Média"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.5}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
