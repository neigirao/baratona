import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, TrendingDown, ArrowRight } from 'lucide-react';
import type { PlatformEvent } from '@/lib/platformEvents';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

interface Props {
  events: EventRow[];
}

function TopTable({
  title,
  icon: Icon,
  rows,
  valueLabel,
}: {
  title: string;
  icon: React.ElementType;
  rows: { id: string; slug: string; name: string; city: string; value: number }[];
  valueLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sem dados.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.city}</p>
                </div>
                <span className="text-sm font-bold text-primary">{r.value} {valueLabel}</span>
                <Link to={`/baratona/${r.slug}`} className="text-muted-foreground hover:text-primary">
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsPanel({ events }: Props) {
  const active = events.filter((e) => e.status !== 'archived');

  // Funil
  const total = active.length;
  const published = active.filter((e) => e.status === 'published').length;
  const withMembers = active.filter((e) => e.memberCount > 1).length;
  const finished = active.filter((e) => e.status === 'finished').length;

  const funnelSteps = [
    { label: 'Criados', value: total, pct: 100 },
    { label: 'Publicados', value: published, pct: total ? Math.round((published / total) * 100) : 0 },
    { label: 'Com membros', value: withMembers, pct: total ? Math.round((withMembers / total) * 100) : 0 },
    { label: 'Finalizados', value: finished, pct: total ? Math.round((finished / total) * 100) : 0 },
  ];

  // Top por membros
  const topByMembers = [...active]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 8)
    .map((e) => ({ id: e.id, slug: e.slug, name: e.name, city: e.city ?? '', value: e.memberCount }));

  // Top por bares
  const topByBars = [...active]
    .sort((a, b) => b.barCount - a.barCount)
    .slice(0, 8)
    .map((e) => ({ id: e.id, slug: e.slug, name: e.name, city: e.city ?? '', value: e.barCount }));

  return (
    <div className="space-y-6">
      {/* Funil */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" /> Funil de eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {total === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum evento ainda.</p>
          ) : (
            <div className="space-y-3">
              {funnelSteps.map((step, i) => (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-medium">{step.value} <span className="text-muted-foreground font-normal">({step.pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${step.pct}%`,
                        opacity: 1 - i * 0.15,
                      }}
                    />
                  </div>
                </div>
              ))}
              {total > 0 && finished > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  Taxa de conclusão: <span className="font-semibold text-foreground">{Math.round((finished / total) * 100)}%</span> dos eventos criados chegaram ao fim.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top eventos */}
      <div className="grid md:grid-cols-2 gap-4">
        <TopTable
          title="Top 8 por membros"
          icon={Users}
          rows={topByMembers}
          valueLabel="membros"
        />
        <TopTable
          title="Top 8 por bares"
          icon={MapPin}
          rows={topByBars}
          valueLabel="bares"
        />
      </div>

      {/* Distribuição por tipo e cidade */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Por tipo</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {[
              { label: 'Baratonas abertas', value: active.filter((e) => e.eventType === 'open_baratona').length },
              { label: 'Circuitos especiais', value: active.filter((e) => e.eventType === 'special_circuit').length },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Top cidades</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {Object.entries(
              active.reduce<Record<string, number>>((acc, e) => {
                const city = e.city || 'Sem cidade';
                acc[city] = (acc[city] ?? 0) + 1;
                return acc;
              }, {}),
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([city, count]) => (
                <div key={city} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{city}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
