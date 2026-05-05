import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Radio, Clock } from 'lucide-react';
import type { PlatformEvent } from '@/lib/platformEvents';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

interface Props {
  events: EventRow[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    published: 'bg-green-500/15 text-green-600 border-green-500/30',
    finished: 'bg-muted text-muted-foreground border-border',
    draft: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
    archived: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  const labels: Record<string, string> = {
    published: 'Publicado', finished: 'Finalizado', draft: 'Rascunho', archived: 'Arquivado',
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${map[status] ?? 'bg-muted'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function EventRow({ event }: { event: EventRow }) {
  const status = event.status ?? 'draft';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{event.name}</span>
          {statusBadge(status)}
          {event.eventType === 'special_circuit' && (
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full">Circuito</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {event.city} · {event.barCount} bares · {event.memberCount} membros
          {event.createdAt && ` · ${timeAgo(event.createdAt)}`}
        </p>
      </div>
      <Link to={`/baratona/${event.slug}`} className="text-muted-foreground hover:text-primary">
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export function ActivityPanel({ events }: Props) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
  );

  const live = events.filter((e) => e.status === 'published');
  const recent = sorted.slice(0, 15);
  const recentlyFinished = events
    .filter((e) => e.status === 'finished')
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Ao vivo agora */}
      <Card className="border-green-500/30">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2 text-green-600">
            <Radio className="w-4 h-4 animate-pulse" /> Publicados agora ({live.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {live.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum evento publicado no momento.</p>
          ) : (
            live.map((e) => <EventRow key={e.id} event={e} />)
          )}
        </CardContent>
      </Card>

      {/* Últimos criados */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Últimos criados
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum evento ainda.</p>
          ) : (
            recent.map((e) => <EventRow key={e.id} event={e} />)
          )}
        </CardContent>
      </Card>

      {/* Finalizados recentemente */}
      {recentlyFinished.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Finalizados recentemente</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentlyFinished.map((e) => <EventRow key={e.id} event={e} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
