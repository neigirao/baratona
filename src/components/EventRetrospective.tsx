import { useMemo } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Beer, Utensils, Users, BarChart3, Crown, MapPin, Star } from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];
const getMedal = (i: number) => MEDALS[i] || `${i + 1}º`;

const SUBTYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  cerveja: { label: 'Cerveja', emoji: '🍺' },
  cachaca: { label: 'Cachaça', emoji: '🥃' },
  drink: { label: 'Drink', emoji: '🍹' },
  batida: { label: 'Batida', emoji: '🧉' },
};

interface Props {
  isCircuit?: boolean;
}

/**
 * Multi-event retrospective — consumes the EventBaratonaProvider context
 * and produces rankings + ratings (including dish_score for circuits).
 */
export function EventRetrospective({ isCircuit = false }: Props) {
  const { participants, consumption, bars, getBarVotes } = useBaratona();

  // Drink ranking (per user)
  const drinkRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter((c: any) => c.type === 'drink').forEach((c: any) => {
      const id = c.user_id || c.participant_id;
      map.set(id, (map.get(id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([id, total]) => ({ user: participants.find((p: any) => p.id === id), total }))
      .filter((r) => r.user)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  // Food ranking
  const foodRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter((c: any) => c.type === 'food').forEach((c: any) => {
      const id = c.user_id || c.participant_id;
      map.set(id, (map.get(id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([id, total]) => ({ user: participants.find((p: any) => p.id === id), total }))
      .filter((r) => r.user)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  // Subtype rankings
  const subtypeRankings = useMemo(() => {
    const subMap = new Map<string, Map<string, number>>();
    consumption.forEach((c: any) => {
      if (c.type !== 'drink' || !c.subtype) return;
      const id = c.user_id || c.participant_id;
      const inner = subMap.get(c.subtype) || new Map();
      inner.set(id, (inner.get(id) || 0) + c.count);
      subMap.set(c.subtype, inner);
    });
    const out: { subtype: string; ranking: { user: any; total: number }[] }[] = [];
    subMap.forEach((inner, sub) => {
      const ranking = Array.from(inner.entries())
        .map(([id, total]) => ({ user: participants.find((p: any) => p.id === id), total }))
        .filter((r) => r.user)
        .sort((a, b) => b.total - a.total);
      if (ranking.length) out.push({ subtype: sub, ranking });
    });
    return out.sort((a, b) => a.subtype.localeCompare(b.subtype));
  }, [consumption, participants]);

  // Bar ratings — includes dish_score for circuits
  const barRatings = useMemo(() => {
    return bars.map((bar: any) => {
      const votes = getBarVotes(bar.id);
      if (votes.length === 0) {
        return { bar, drink: 0, food: 0, vibe: 0, service: 0, dish: 0, avg: 0, voteCount: 0, dishVoteCount: 0 };
      }
      const safeAvg = (key: string) => {
        const vals = votes.map((v: any) => v[key]).filter((n: any) => typeof n === 'number');
        return vals.length ? vals.reduce((s: number, n: number) => s + n, 0) / vals.length : 0;
      };
      const drink = safeAvg('drink_score');
      const food = safeAvg('food_score');
      const vibe = safeAvg('vibe_score');
      const service = safeAvg('service_score');
      const dish = safeAvg('dish_score');
      const dishVoteCount = votes.filter((v: any) => typeof v.dish_score === 'number').length;
      // Open baratonas: 4-axis avg. Circuits: dish-only avg.
      const avg = isCircuit ? dish : (drink + food + vibe + service) / 4;
      return { bar, drink, food, vibe, service, dish, avg, voteCount: votes.length, dishVoteCount };
    }).sort((a, b) => b.avg - a.avg);
  }, [bars, getBarVotes, isCircuit]);

  const dishRanking = useMemo(
    () => barRatings.filter((b) => b.dishVoteCount > 0),
    [barRatings]
  );

  const globalAverage = useMemo(() => {
    const rated = barRatings.filter((b) => b.voteCount > 0);
    if (!rated.length) return null;
    return (rated.reduce((s, b) => s + b.avg, 0) / rated.length).toFixed(1);
  }, [barRatings]);

  const groupStats = useMemo(() => {
    const totalDrinks = drinkRanking.reduce((s, r) => s + r.total, 0);
    const totalFood = foodRanking.reduce((s, r) => s + r.total, 0);
    const activeIds = new Set<string>();
    consumption.forEach((c: any) => activeIds.add(c.user_id || c.participant_id));
    const totalVotes = bars.reduce((s: number, b: any) => s + getBarVotes(b.id).length, 0);
    const active = activeIds.size;
    return {
      totalParticipants: participants.length,
      avgDrinks: active ? (totalDrinks / active).toFixed(1) : '0',
      avgFood: active ? (totalFood / active).toFixed(1) : '0',
      totalVotes,
    };
  }, [drinkRanking, foodRanking, consumption, participants, bars, getBarVotes]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <Stat value={groupStats.totalParticipants} label="Participantes" />
            <Stat value={groupStats.avgDrinks} label="Média bebidas/pessoa" />
            <Stat value={groupStats.avgFood} label="Média comidas/pessoa" />
            <Stat value={groupStats.totalVotes} label="Avaliações feitas" />
            {globalAverage && (
              <Stat value={`${globalAverage}/5`} label={isCircuit ? 'Nota média dos petiscos' : 'Nota média geral'} accent />
            )}
          </div>
        </CardContent>
      </Card>

      {isCircuit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="w-4 h-4 text-secondary" /> Ranking de Petiscos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dishRanking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum voto em petisco ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Buteco</TableHead>
                    <TableHead>Petisco</TableHead>
                    <TableHead className="text-right">Nota</TableHead>
                    <TableHead className="text-right">Votos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dishRanking.map((b, i) => (
                    <TableRow key={b.bar.id} className={i < 3 ? 'font-semibold' : ''}>
                      <TableCell>{getMedal(i)}</TableCell>
                      <TableCell className="whitespace-nowrap">{b.bar.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.bar.featured_dish || '—'}</TableCell>
                      <TableCell className="text-right font-bold inline-flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-secondary fill-secondary" /> {b.dish.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{b.dishVoteCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!isCircuit && barRatings.some((b) => b.voteCount > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" /> Resumo por Bar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bar</TableHead>
                    <TableHead className="text-center">Média</TableHead>
                    <TableHead className="text-center">🍺</TableHead>
                    <TableHead className="text-center">🍽️</TableHead>
                    <TableHead className="text-center">🎵</TableHead>
                    <TableHead className="text-center">🤝</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barRatings.filter((b) => b.voteCount > 0).map((b, i) => (
                    <TableRow key={b.bar.id} className={i === 0 ? 'font-semibold bg-amber-500/10' : ''}>
                      <TableCell className="whitespace-nowrap">{i === 0 && '🏆 '}{b.bar.name}</TableCell>
                      <TableCell className="text-center font-bold">{b.avg.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.drink.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.food.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.vibe.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{b.service.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Ranking title="Ranking de Bebidas" icon={<Beer className="w-4 h-4 text-amber-500" />} list={drinkRanking} suffix="🍺" />
      <Ranking title="Ranking de Comidas" icon={<Utensils className="w-4 h-4 text-orange-500" />} list={foodRanking} suffix="🍽️" />

      {subtypeRankings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500" /> Por Tipo de Bebida
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {subtypeRankings.map(({ subtype, ranking }) => {
              const cfg = SUBTYPE_CONFIG[subtype] || { label: subtype, emoji: '🍺' };
              return (
                <div key={subtype}>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <span className="text-lg">{cfg.emoji}</span> Rei da {cfg.label}
                  </h4>
                  <Table>
                    <TableBody>
                      {ranking.slice(0, 5).map((r, i) => (
                        <TableRow key={r.user.id}>
                          <TableCell className="w-12">{getMedal(i)}</TableCell>
                          <TableCell>{r.user.name}</TableCell>
                          <TableCell className="text-right">{r.total} {cfg.emoji}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${accent ? 'bg-secondary/10' : 'bg-muted/50'}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Ranking({
  title, icon, list, suffix,
}: { title: string; icon: React.ReactNode; list: { user: any; total: number }[]; suffix: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
        ) : (
          <Table>
            <TableBody>
              {list.slice(0, 10).map((r, i) => (
                <TableRow key={r.user.id} className={i < 3 ? 'font-semibold' : ''}>
                  <TableCell className="w-12">{getMedal(i)}</TableCell>
                  <TableCell>{r.user.name}</TableCell>
                  <TableCell className="text-right">{r.total} {suffix}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
