import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, ChevronRight, Beer, Sparkles } from 'lucide-react';
import type { PlatformEvent } from '@/lib/platformEvents';

interface Props {
  event: PlatformEvent & { barCount: number; memberCount: number };
}

function formatDateRange(start?: string | null, end?: string | null, fallback?: string | null) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (fallback) return fmt(fallback);
  return null;
}

export function FeaturedEventCard({ event }: Props) {
  const isCircuit = event.eventType === 'special_circuit';
  const dateLabel = formatDateRange(event.startDate, event.endDate, event.eventDate);

  return (
    <Card className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all bg-card/60">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background flex items-center justify-center">
            <Beer className="w-16 h-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant={isCircuit ? 'secondary' : 'default'} className="font-semibold shadow-lg">
            {isCircuit ? (
              <><Sparkles className="w-3 h-3 mr-1" /> Circuito Especial</>
            ) : (
              <><Beer className="w-3 h-3 mr-1" /> Baratona</>
            )}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg leading-tight line-clamp-1">{event.name}</h3>
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {event.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {event.memberCount} {event.memberCount === 1 ? 'participante' : 'participantes'}
          </span>
          {event.barCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Beer className="w-3.5 h-3.5" /> {event.barCount} {event.barCount === 1 ? 'bar' : 'bares'}
            </span>
          )}
          {dateLabel && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {dateLabel}
            </span>
          )}
        </div>

        <Button asChild size="sm" className="w-full font-semibold">
          <Link to={`/baratona/${event.slug}`}>
            Ver evento
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
