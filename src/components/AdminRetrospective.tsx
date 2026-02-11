import { useMemo, useState, useEffect } from 'react';
import { useBaratona } from '@/contexts/BaratonaContext';
import { useCheckins } from '@/hooks/useCheckins';
import { ACHIEVEMENTS } from '@/hooks/useAchievements';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Utensils, Beer, Star, Users, UserX, Laugh, Info, Award, MapPin, BarChart3, Clock, CheckCircle, XCircle, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MEDALS = ['🥇', '🥈', '🥉'];

function getMedal(index: number) {
  return MEDALS[index] || `${index + 1}º`;
}

const SUBTYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  cerveja: { label: 'Cerveja', emoji: '🍺' },
  cachaca: { label: 'Cachaça', emoji: '🥃' },
  drink: { label: 'Drink', emoji: '🍹' },
  batida: { label: 'Batida', emoji: '🧉' },
};

export function AdminRetrospective() {
  const { participants, consumption, bars, getBarVotes } = useBaratona();
  const { checkins } = useCheckins();

  // Fetch all achievements from DB
  const [allAchievements, setAllAchievements] = useState<{ participant_id: string; achievement_key: string }[]>([]);
  useEffect(() => {
    supabase.from('achievements').select('participant_id, achievement_key').then(({ data }) => {
      if (data) setAllAchievements(data);
    });
  }, []);

  // Drink ranking
  const drinkRanking = useMemo(() => {
    const map = new Map<string, number>();
    consumption.filter(c => c.type === 'drink').forEach(c => {
      map.set(c.participant_id, (map.get(c.participant_id) || 0) + c.count);
    });
    return Array.from(map.entries())
      .map(([pid, total]) => ({ participant: participants.find(p => p.id === pid), total }))
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
      .map(([pid, total]) => ({ participant: participants.find(p => p.id === pid), total }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [consumption, participants]);

  // Achievement ranking
  const achievementRanking = useMemo(() => {
    const map = new Map<string, string[]>();
    allAchievements.forEach(a => {
      const list = map.get(a.participant_id) || [];
      list.push(a.achievement_key);
      map.set(a.participant_id, list);
    });
    return Array.from(map.entries())
      .map(([pid, keys]) => ({ participant: participants.find(p => p.id === pid), keys, total: keys.length }))
      .filter(r => r.participant)
      .sort((a, b) => b.total - a.total);
  }, [allAchievements, participants]);

  // Consumption per bar
  const consumptionPerBar = useMemo(() => {
    const map = new Map<number, { drinks: number; food: number }>();
    consumption.forEach(c => {
      if (!c.bar_id) return;
      const entry = map.get(c.bar_id) || { drinks: 0, food: 0 };
      if (c.type === 'drink') entry.drinks += c.count;
      else entry.food += c.count;
      map.set(c.bar_id, entry);
    });
    return bars.map(bar => {
      const data = map.get(bar.id) || { drinks: 0, food: 0 };
      return { bar, ...data, total: data.drinks + data.food };
    }).sort((a, b) => b.total - a.total);
  }, [consumption, bars]);

  // Check-ins per bar
  const checkinsPerBar = useMemo(() => {
    const map = new Map<number, Set<string>>();
    checkins.forEach(c => {
      const set = map.get(c.bar_id) || new Set();
      set.add(c.participant_id);
      map.set(c.bar_id, set);
    });
    return bars.map(bar => {
      const count = map.get(bar.id)?.size || 0;
      return { bar, count };
    }).sort((a, b) => b.count - a.count);
  }, [checkins, bars]);

  // Bar ratings
  const barRatings = useMemo(() => {
    return bars.map(bar => {
      const votes = getBarVotes(bar.id);
      if (votes.length === 0) return { bar, drink: 0, food: 0, vibe: 0, service: 0, avg: 0, voteCount: 0 };
      const drink = votes.reduce((s, v) => s + v.drink_score, 0) / votes.length;
      const food = votes.reduce((s, v) => s + v.food_score, 0) / votes.length;
      const vibe = votes.reduce((s, v) => s + v.vibe_score, 0) / votes.length;
      const service = votes.reduce((s, v) => s + v.service_score, 0) / votes.length;
      const avg = (drink + food + vibe + service) / 4;
      return { bar, drink, food, vibe, service, avg, voteCount: votes.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [bars, getBarVotes]);

  const bestBar = barRatings.length > 0 && barRatings[0].voteCount > 0 ? barRatings[0] : null;

  // === NEW: Global average across all bars ===
  const globalAverage = useMemo(() => {
    const rated = barRatings.filter(b => b.voteCount > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((s, b) => s + b.avg, 0);
    return (sum / rated.length).toFixed(1);
  }, [barRatings]);

  // === NEW: Consolidated bar summary ===
  const barSummary = useMemo(() => {
    return bars.map(bar => {
      const rating = barRatings.find(r => r.bar.id === bar.id) || { drink: 0, food: 0, vibe: 0, service: 0, avg: 0, voteCount: 0 };
      const cons = consumptionPerBar.find(c => c.bar.id === bar.id) || { drinks: 0, food: 0, total: 0 };
      const checkinData = checkinsPerBar.find(c => c.bar.id === bar.id) || { count: 0 };
      return {
        bar,
        avgRating: rating.avg,
        drinkRating: rating.drink,
        foodRating: rating.food,
        vibeRating: rating.vibe,
        serviceRating: rating.service,
        voteCount: rating.voteCount,
        totalDrinks: cons.drinks,
        totalFood: cons.food,
        presence: checkinData.count,
      };
    }).filter(b => b.voteCount > 0 || b.totalDrinks > 0 || b.totalFood > 0 || b.presence > 0)
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [bars, barRatings, consumptionPerBar, checkinsPerBar]);

  // === NEW: Subtype drink rankings ===
  const subtypeRankings = useMemo(() => {
    const subtypeMap = new Map<string, Map<string, number>>();
    consumption.forEach(c => {
      if (c.type !== 'drink') return;
      const sub = (c as any).subtype as string | null;
      if (!sub) return;
      const participantMap = subtypeMap.get(sub) || new Map<string, number>();
      participantMap.set(c.participant_id, (participantMap.get(c.participant_id) || 0) + c.count);
      subtypeMap.set(sub, participantMap);
    });
    const result: { subtype: string; ranking: { participant: typeof participants[0] | undefined; total: number }[] }[] = [];
    subtypeMap.forEach((pMap, sub) => {
      const ranking = Array.from(pMap.entries())
        .map(([pid, total]) => ({ participant: participants.find(p => p.id === pid), total }))
        .filter(r => r.participant)
        .sort((a, b) => b.total - a.total);
      if (ranking.length > 0) result.push({ subtype: sub, ranking });
    });
    return result.sort((a, b) => a.subtype.localeCompare(b.subtype));
  }, [consumption, participants]);

  // === NEW: Fidelity ranking (unique bars visited) ===
  const fidelityRanking = useMemo(() => {
    const map = new Map<string, Set<number>>();
    checkins.forEach(c => {
      const set = map.get(c.participant_id) || new Set();
      set.add(c.bar_id);
      map.set(c.participant_id, set);
    });
    return Array.from(map.entries())
      .map(([pid, barSet]) => ({ participant: participants.find(p => p.id === pid), barsVisited: barSet.size }))
      .filter(r => r.participant)
      .sort((a, b) => b.barsVisited - a.barsVisited);
  }, [checkins, participants]);

  // === NEW: Who voted / who didn't ===
  const { votedList, notVotedList } = useMemo(() => {
    const voterIds = new Set<string>();
    bars.forEach(bar => {
      getBarVotes(bar.id).forEach(v => voterIds.add(v.participant_id));
    });
    return {
      votedList: participants.filter(p => voterIds.has(p.id)),
      notVotedList: participants.filter(p => !voterIds.has(p.id)),
    };
  }, [participants, bars, getBarVotes]);

  // === NEW: Peak hour per bar ===
  const peakHours = useMemo(() => {
    const barHourMap = new Map<number, Map<number, number>>();
    checkins.forEach(c => {
      const hour = new Date(c.checked_in_at).getHours();
      const hourMap = barHourMap.get(c.bar_id) || new Map<number, number>();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      barHourMap.set(c.bar_id, hourMap);
    });
    return bars.map(bar => {
      const hourMap = barHourMap.get(bar.id);
      if (!hourMap || hourMap.size === 0) return { bar, peakHour: null, count: 0 };
      let maxHour = 0, maxCount = 0;
      hourMap.forEach((count, hour) => {
        if (count > maxCount) { maxCount = count; maxHour = hour; }
      });
      return { bar, peakHour: maxHour, count: maxCount };
    }).filter(b => b.peakHour !== null);
  }, [checkins, bars]);

  // Group stats
  const groupStats = useMemo(() => {
    const totalDrinks = drinkRanking.reduce((s, r) => s + r.total, 0);
    const totalFood = foodRanking.reduce((s, r) => s + r.total, 0);
    const activeCount = new Set([
      ...consumption.map(c => c.participant_id),
      ...checkins.map(c => c.participant_id),
    ]).size;
    const totalVotes = bars.reduce((s, bar) => s + getBarVotes(bar.id).length, 0);
    return {
      totalParticipants: participants.length,
      activeCount,
      avgDrinks: activeCount > 0 ? (totalDrinks / activeCount).toFixed(1) : '0',
      avgFood: activeCount > 0 ? (totalFood / activeCount).toFixed(1) : '0',
      totalAchievements: allAchievements.length,
      totalVotes,
    };
  }, [drinkRanking, foodRanking, consumption, checkins, participants, bars, getBarVotes, allAchievements]);

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
    try { return parseInt(localStorage.getItem('baratona_jokes') || '0', 10); } catch { return 0; }
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Group Stats + Global Average */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{groupStats.totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{groupStats.avgDrinks}</p>
              <p className="text-xs text-muted-foreground">Média bebidas/pessoa</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{groupStats.avgFood}</p>
              <p className="text-xs text-muted-foreground">Média comidas/pessoa</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{groupStats.totalAchievements}</p>
              <p className="text-xs text-muted-foreground">Conquistas desbloqueadas</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{groupStats.totalVotes}</p>
              <p className="text-xs text-muted-foreground">Avaliações feitas</p>
            </div>
            {globalAverage && (
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{globalAverage}/5</p>
                <p className="text-xs text-muted-foreground">Nota média geral</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Resumo Completo por Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            Resumo Completo por Bar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {barSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
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
                    <TableHead className="text-center">Bebidas</TableHead>
                    <TableHead className="text-center">Comidas</TableHead>
                    <TableHead className="text-center">👥</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barSummary.map((b, i) => (
                    <TableRow key={b.bar.id} className={i === 0 ? 'font-semibold bg-amber-500/10' : ''}>
                      <TableCell className="whitespace-nowrap">
                        {i === 0 && '🏆 '}{b.bar.name}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {b.voteCount > 0 ? b.avgRating.toFixed(1) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{b.voteCount > 0 ? b.drinkRating.toFixed(1) : '-'}</TableCell>
                      <TableCell className="text-center">{b.voteCount > 0 ? b.foodRating.toFixed(1) : '-'}</TableCell>
                      <TableCell className="text-center">{b.voteCount > 0 ? b.vibeRating.toFixed(1) : '-'}</TableCell>
                      <TableCell className="text-center">{b.voteCount > 0 ? b.serviceRating.toFixed(1) : '-'}</TableCell>
                      <TableCell className="text-center">{b.totalDrinks}</TableCell>
                      <TableCell className="text-center">{b.totalFood}</TableCell>
                      <TableCell className="text-center">{b.presence}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Drink Ranking */}
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

      {/* 4. Ranking por Tipo de Bebida */}
      {subtypeRankings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500" />
              Ranking por Tipo de Bebida
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {subtypeRankings.map(({ subtype, ranking }) => {
              const config = SUBTYPE_CONFIG[subtype] || { label: subtype, emoji: '🍺' };
              return (
                <div key={subtype}>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <span className="text-lg">{config.emoji}</span>
                    Rei da {config.label}
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.slice(0, 5).map((r, i) => (
                        <TableRow key={r.participant!.id} className={i < 3 ? 'font-semibold' : ''}>
                          <TableCell>{getMedal(i)}</TableCell>
                          <TableCell>{r.participant!.name}</TableCell>
                          <TableCell className="text-right">{r.total} {config.emoji}</TableCell>
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

      {/* 5. Food Ranking */}
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

      {/* 6. Achievement Ranking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-500" />
            Ranking de Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {achievementRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conquista ainda.</p>
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
                {achievementRanking.map((r, i) => (
                  <TableRow key={r.participant!.id} className={i < 3 ? 'font-semibold' : ''}>
                    <TableCell>{getMedal(i)}</TableCell>
                    <TableCell>
                      <div>
                        {r.participant!.name}
                        {i < 3 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {r.keys.map(k => ACHIEVEMENTS.find(a => a.key === k)?.emoji || '🏅').join(' ')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{r.total} 🏅</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 7. Fidelity Ranking */}
      {fidelityRanking.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Ranking de Fidelidade
              <span className="text-xs text-muted-foreground font-normal ml-auto">Bares visitados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Bares</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fidelityRanking.map((r, i) => (
                  <TableRow key={r.participant!.id} className={i < 3 ? 'font-semibold' : ''}>
                    <TableCell>{getMedal(i)}</TableCell>
                    <TableCell>
                      {r.participant!.name}
                      {r.barsVisited === bars.length && bars.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-emerald-500/10 text-emerald-700">
                          🎖️ Todos!
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r.barsVisited}/{bars.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 8. Consumption per Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Beer className="w-4 h-4 text-teal-500" />
            Consumo por Bar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {consumptionPerBar.every(c => c.total === 0) ? (
            <p className="text-sm text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bar</TableHead>
                  <TableHead className="text-center">🍺</TableHead>
                  <TableHead className="text-center">🍽️</TableHead>
                  <TableHead className="text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionPerBar.filter(c => c.total > 0).map((c, i) => (
                  <TableRow key={c.bar.id} className={i === 0 ? 'font-semibold bg-teal-500/10' : ''}>
                    <TableCell className="whitespace-nowrap">
                      {i === 0 && '🏆 '}{c.bar.name}
                    </TableCell>
                    <TableCell className="text-center">{c.drinks}</TableCell>
                    <TableCell className="text-center">{c.food}</TableCell>
                    <TableCell className="text-center font-bold">{c.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 9. Check-ins per Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-500" />
            Presença por Bar
            {checkinsPerBar.length > 0 && checkinsPerBar[0].count > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                🏆 {checkinsPerBar[0].bar.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {checkinsPerBar.every(c => c.count === 0) ? (
            <p className="text-sm text-muted-foreground">Nenhum check-in ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bar</TableHead>
                  <TableHead className="text-right">Pessoas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkinsPerBar.filter(c => c.count > 0).map((c, i) => (
                  <TableRow key={c.bar.id} className={i === 0 ? 'font-semibold bg-cyan-500/10' : ''}>
                    <TableCell>{i === 0 && '🏆 '}{c.bar.name}</TableCell>
                    <TableCell className="text-right">{c.count} 👥</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 10. Bar Ratings */}
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

      {/* 11. Who Voted / Who Didn't */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-indigo-500" />
            Quem Votou / Quem Não Votou
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-indigo-600 mb-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Votaram ({votedList.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {votedList.map(p => (
                <Badge key={p.id} variant="secondary" className="bg-indigo-500/10 text-indigo-700 border-indigo-500/20">
                  ✅ {p.name}
                </Badge>
              ))}
              {votedList.length === 0 && <p className="text-sm text-muted-foreground">Ninguém ainda.</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              Não votaram ({notVotedList.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {notVotedList.map(p => (
                <Badge key={p.id} variant="outline" className="text-muted-foreground">
                  ⚪ {p.name}
                </Badge>
              ))}
              {notVotedList.length === 0 && <p className="text-sm text-muted-foreground">Todos votaram! 🎉</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 12. Peak Hours */}
      {peakHours.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              Hora de Pico por Bar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {peakHours.map(ph => (
                <div key={ph.bar.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{ph.bar.name}</span>
                  <span className="text-muted-foreground">
                    🕐 {ph.peakHour!.toString().padStart(2, '0')}h ({ph.count} check-ins)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 13. Jokes */}
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

      {/* 14. Usage */}
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