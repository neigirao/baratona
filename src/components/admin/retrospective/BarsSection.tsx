import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Beer, MapPin, Star, Clock } from 'lucide-react';
import type { useRetrospectiveData } from './useRetrospectiveData';

type Data = ReturnType<typeof useRetrospectiveData>;

export function BarsSection({
  consumptionPerBar, checkinsPerBar, barRatings, bestBar, peakHours,
}: Pick<Data, 'consumptionPerBar' | 'checkinsPerBar' | 'barRatings' | 'bestBar' | 'peakHours'>) {
  return (
    <>
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
                    <TableCell className="whitespace-nowrap">{i === 0 && '🏆 '}{c.bar.name}</TableCell>
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
                      <TableCell className="whitespace-nowrap">{i === 0 && '🏆 '}{b.bar.name}</TableCell>
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
    </>
  );
}
