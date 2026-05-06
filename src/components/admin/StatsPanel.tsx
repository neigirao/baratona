import { Users, Beer, MapPin, Trophy, TrendingUp, Zap, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PlatformStats } from '@/lib/api';

interface Props {
  stats: PlatformStats;
}

function KpiCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="py-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-[11px] text-primary mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsPanel({ stats }: Props) {
  const publishedPct = stats.totalEvents > 0
    ? Math.round((stats.activeEvents / stats.totalEvents) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Eventos */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" /> Eventos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total de eventos" value={stats.totalEvents} icon={BarChart3} />
          <KpiCard label="Publicados agora" value={stats.activeEvents} sub={`${publishedPct}% do total`} icon={Zap} highlight />
          <KpiCard label="Finalizados" value={stats.finishedEvents} icon={Trophy} />
          <KpiCard label="Em rascunho" value={stats.draftEvents} icon={Calendar} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          <KpiCard label="Criados nos últimos 7 dias" value={stats.eventsLast7d} icon={TrendingUp} />
          <KpiCard label="Criados nos últimos 30 dias" value={stats.eventsLast30d} icon={TrendingUp} />
          <KpiCard label="Circuitos especiais" value={stats.circuitEvents} icon={MapPin} />
        </div>
      </section>

      {/* Usuários */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Usuários
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Usuários registrados" value={stats.totalUsers} icon={Users} />
          <KpiCard label="Novos (últimos 7 dias)" value={stats.usersLast7d} icon={TrendingUp} highlight={stats.usersLast7d > 0} />
          <KpiCard label="Novos (últimos 30 dias)" value={stats.usersLast30d} icon={TrendingUp} />
          <KpiCard label="Organizadores recorrentes" value={stats.recurringCreators} sub="criaram +1 evento" icon={Trophy} />
        </div>
      </section>

      {/* Engajamento */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Beer className="w-3.5 h-3.5" /> Engajamento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total de membros" value={stats.totalMembers} icon={Users} />
          <KpiCard label="Total de check-ins" value={stats.totalCheckins} icon={MapPin} />
          <KpiCard label="Itens de consumo" value={stats.totalConsumption} icon={Beer} />
          <KpiCard label="Média de membros/evento" value={stats.avgMembersPerEvent || '—'} icon={Users} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          <KpiCard label="Média de bares/evento" value={stats.avgBarsPerEvent || '—'} icon={MapPin} />
        </div>
      </section>

      {/* Crescimento por mês */}
      {stats.eventsByMonth.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Eventos criados por mês (últimos 6 meses)
          </h3>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-end gap-2 h-24">
                {(() => {
                  const max = Math.max(...stats.eventsByMonth.map((m) => m.total), 1);
                  return stats.eventsByMonth.map((m) => (
                    <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] text-muted-foreground font-mono">{m.total}</span>
                      <div
                        className="w-full rounded-t bg-primary/70"
                        style={{ height: `${Math.max(4, (m.total / max) * 72)}px` }}
                      />
                      <span className="text-[9px] text-muted-foreground">{m.month.slice(5)}</span>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
