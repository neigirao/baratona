import { useMemo } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { useCheckins } from '@/hooks/useCheckins';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Utensils, Beer, Star, Users, UserX, Laugh, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MEDALS = ['🥇', '🥈', '🥉'];

function getMedal(index: number) {
  return MEDALS[index] || `${index + 1}º`;
}

export function AdminRetrospective() {
  const { participants, consumption, bars, getBarVotes } = useBaratona();
  const { checkins } = useCheckins();

  // Drink ranking
  const drinkRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter(c => c.type === 'drink').forEach(c => {
      map.set(c.participant_id, (map.get(c.participant_id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([pid, total]) => ({
        participant: participants.find(p => p.id === pid),
        total,
      }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  // Food ranking
  const foodRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter(c => c.type === 'food').forEach(c => {
      map.set(c.participant_id, (map.get(c.participant_id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([pid, total]) => ({
        participant: participants.find(p => p.id === pid),
        total,
      }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  // Bar ratings
  const barRatings = useMemo(() => {
    return bars.map(bar => {
      const votes = getBarVotes(bar.id);
      if (votes.length === 0) {
        return { bar, drink: 0, food: 0, vibe: 0, service: 0, avg: 0, voteCount: 0 };
      }
      const drink = votes.reduce((s, v) => s + v.drink_score, 0) / votes.length;
      const food = votes.reduce((s, v) => s + v.food_score, 0) / votes.length;
      const vibe = votes.reduce((s, v) => s + v.vibe_score, 0) / votes.length;
      const service = votes.reduce((s, v) => s + v.service_score, 0) / votes.length;
      const avg = (drink + food + vibe + service) / 4;
      return { bar, drink, food, vibe, service, avg, voteCount: votes.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [bars, getBarVotes]);

  const bestBar = barRatings.length > 0 && barRatings[0].voteCount > 0 ? barRatings[0] : null;

  // Usage: who used / who didn't
  const { usedList, notUsedList } = useMemo(() => {
    const activeIds = new Set<string>();
    checkins.forEach(c => activeIds.add(c.participant_id));
    consumption.forEach(c => activeIds.add(c.participant_id));
    return {
      usedList: participants.filter(p => activeIds.has(p.id)),
      notUsedList: participants.filter(p => !activeIds.has(p.id)),
    };
  }, [participants, checkins, consumption]);

  // Local jokes count
  const jokesCount = useMemo(() => {
    try {
      return parseInt(localStorage.getItem('baratona_jokes') || '0', 10);
    } catch {
      return 0;
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Drink Ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Beer className="w-4 h-4 text-amber-500" />
            Ranking de Bebidas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {drinkRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drinkRanking.map((r, i) => (
                  <TableRow key={r.participant!.id} className={i < 3 ? 'font-semibold' : ''}>
                    <TableCell>{getMedal(i)}</TableCell>
                    <TableCell>{r.participant!.name}</TableCell>
                    <TableCell className="text-right">{r.total} 🍺</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Food Ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Utensils className="w-4 h-4 text-orange-500" />
            Ranking de Comida
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {foodRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foodRanking.map((r, i) => (
                  <TableRow key={r.participant!.id} className={i < 3 ? 'font-semibold' : ''}>
                    <TableCell>{getMedal(i)}</TableCell>
                    <TableCell>{r.participant!.name}</TableCell>
                    <TableCell className="text-right">{r.total} 🍽️</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bar Ratings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Notas dos Restaurantes
            {bestBar && (
              <Badge variant="secondary" className="ml-auto text-xs">
                🏆 {bestBar.bar.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {barRatings.every(b => b.voteCount === 0) ? (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bar</TableHead>
                    <TableHead className="text-center">🍺</TableHead>
                    <TableHead className="text-center">🍽️</TableHead>
                    <TableHead className="text-center">🎵</TableHead>
                    <TableHead className="text-center">🤝</TableHead>
                    <TableHead className="text-center font-bold">Média</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barRatings.filter(b => b.voteCount > 0).map((b, i) => (
                    <TableRow key={b.bar.id} className={i === 0 ? 'font-semibold bg-yellow-500/10' : ''}>
                      <TableCell className="whitespace-nowrap">
                        {i === 0 && '🏆 '}{b.bar.name}
                      </TableCell>
                      <TableCell className="text-center">{b.drink.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.food.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.vibe.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.service.toFixed(1)}</TableCell>
                      <TableCell className="text-center font-bold">{b.avg.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jokes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Laugh className="w-4 h-4 text-pink-500" />
            Piadas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>O contador de piadas é local (cada celular tem o seu). Não há ranking global.</span>
          </div>
          <p className="text-sm">
            Total neste dispositivo: <span className="font-bold text-lg">{jokesCount}</span> 😂
          </p>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            Quem Usou / Quem Não Usou
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-green-600 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Participaram ({usedList.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {usedList.map(p => (
                <Badge key={p.id} variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                  ✅ {p.name}
                </Badge>
              ))}
              {usedList.length === 0 && <p className="text-sm text-muted-foreground">Ninguém ainda.</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <UserX className="w-3.5 h-3.5" />
              Não participaram ({notUsedList.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {notUsedList.map(p => (
                <Badge key={p.id} variant="outline" className="text-muted-foreground">
                  ⚪ {p.name}
                </Badge>
              ))}
              {notUsedList.length === 0 && <p className="text-sm text-muted-foreground">Todos participaram! 🎉</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
