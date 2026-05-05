import { AlertTriangle, Clock, Users, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlatformEvent } from '@/lib/platformEvents';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

interface Props {
  events: EventRow[];
}

function AlertItem({ label, sub, href }: { label: string; sub?: string; href: string }) {
  return (
    <Link
      to={href}
      className="flex items-start gap-3 py-2.5 border-b border-border last:border-0 hover:text-primary transition-colors"
    >
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </Link>
  );
}

function AlertGroup({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ElementType;
  items: React.ReactNode;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-amber-500" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {items ?? <p className="text-xs text-muted-foreground italic">{empty}</p>}
      </CardContent>
    </Card>
  );
}

export function AlertsPanel({ events }: Props) {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const publishedNoMembers = events.filter(
    (e) => (e as any).status === 'published' && e.memberCount <= 1,
  );

  const staleDrafts = events.filter(
    (e) =>
      (e as any).status === 'draft' &&
      e.createdAt &&
      now - new Date(e.createdAt).getTime() > sevenDaysMs,
  );

  const barsNoCheckins = events.filter(
    (e) =>
      (e as any).status === 'published' &&
      e.barCount > 0 &&
      e.memberCount > 1,
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Alertas operacionais — situações que podem indicar eventos abandonados ou com baixo engajamento.
      </p>

      <AlertGroup
        title={`Publicados sem membros (${publishedNoMembers.length})`}
        icon={Users}
        empty="Nenhum evento publicado sem membros. Ótimo!"
        items={
          publishedNoMembers.length > 0 ? (
            <div>
              {publishedNoMembers.map((e) => (
                <AlertItem
                  key={e.id}
                  label={e.name}
                  sub={`${e.city ?? 'Sem cidade'} · publicado · ${e.barCount} bares`}
                  href={`/baratona/${e.slug}`}
                />
              ))}
            </div>
          ) : null
        }
      />

      <AlertGroup
        title={`Rascunhos parados há mais de 7 dias (${staleDrafts.length})`}
        icon={Clock}
        empty="Nenhum rascunho antigo."
        items={
          staleDrafts.length > 0 ? (
            <div>
              {staleDrafts.map((e) => {
                const daysSince = Math.floor(
                  (now - new Date(e.createdAt!).getTime()) / 86400000,
                );
                return (
                  <AlertItem
                    key={e.id}
                    label={e.name}
                    sub={`Criado há ${daysSince} dias · ${e.barCount} bares`}
                    href={`/baratona/${e.slug}`}
                  />
                );
              })}
            </div>
          ) : null
        }
      />

      <AlertGroup
        title={`Publicados com bares mas sem check-ins recentes`}
        icon={MapPin}
        empty="Sem alertas de engajamento no momento."
        items={
          barsNoCheckins.length > 0 ? (
            <div>
              {barsNoCheckins.slice(0, 10).map((e) => (
                <AlertItem
                  key={e.id}
                  label={e.name}
                  sub={`${e.barCount} bares · ${e.memberCount} membros`}
                  href={`/baratona/${e.slug}`}
                />
              ))}
            </div>
          ) : null
        }
      />
    </div>
  );
}
