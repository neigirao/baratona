import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Beer, Utensils, Trophy, Award, MapPin } from 'lucide-react';
import { ACHIEVEMENTS } from '@/hooks/useAchievements';
import { getMedal, SUBTYPE_CONFIG, type useRetrospectiveData } from './useRetrospectiveData';

type Data = ReturnType<typeof useRetrospectiveData>;

export function RankingsSection({
  drinkRanking, foodRanking, achievementRanking, subtypeRankings, fidelityRanking, bars,
}: Pick<Data, 'drinkRanking' | 'foodRanking' | 'achievementRanking' | 'subtypeRankings' | 'fidelityRanking' | 'bars'>) {
  return (
    <>
      <RankCard title="Ranking de Bebidas" icon={<Beer className="w-4 h-4 text-amber-500" />}
        rows={drinkRanking} unit="🍺" />

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
              const cfg = SUBTYPE_CONFIG[subtype] || { label: subtype, emoji: '🍺' };
              return (
                <div key={subtype}>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <span className="text-lg">{cfg.emoji}</span>
                    Rei da {cfg.label}
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

      <RankCard title="Ranking de Comida" icon={<Utensils className="w-4 h-4 text-orange-500" />}
        rows={foodRanking} unit="🍽️" />

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
    </>
  );
}

function RankCard({
  title, icon, rows, unit,
}: {
  title: string; icon: React.ReactNode;
  rows: { participant: any; total: number }[]; unit: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}{title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
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
              {rows.map((r, i) => (
                <TableRow key={r.participant!.id} className={i < 3 ? 'font-semibold' : ''}>
                  <TableCell>{getMedal(i)}</TableCell>
                  <TableCell>{r.participant!.name}</TableCell>
                  <TableCell className="text-right">{r.total} {unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
