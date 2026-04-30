import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Crown } from 'lucide-react';
import type { useRetrospectiveData } from './useRetrospectiveData';

type Data = ReturnType<typeof useRetrospectiveData>;

export function StatsSection({ groupStats, globalAverage, barSummary }: Pick<Data, 'groupStats' | 'globalAverage' | 'barSummary'>) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <Stat value={groupStats.totalParticipants} label="Participantes" />
            <Stat value={groupStats.avgDrinks} label="Média bebidas/pessoa" />
            <Stat value={groupStats.avgFood} label="Média comidas/pessoa" />
            <Stat value={groupStats.totalAchievements} label="Conquistas desbloqueadas" />
            <Stat value={groupStats.totalVotes} label="Avaliações feitas" />
            {globalAverage && (
              <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{globalAverage}/5</p>
                <p className="text-xs text-muted-foreground">Nota média geral</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
