import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { type PlatformEvent } from '@/lib/platformEvents';
import { listPublicEventsWithBarCountApi } from '@/lib/platformApi';
import { useSeo } from '@/hooks/useSeo';
import { MapPin, Beer, ChevronLeft, Search, Plus, Users, Calendar } from 'lucide-react';

type EnrichedEvent = PlatformEvent & { barCount: number; memberCount: number };

export default function Explore() {
  useSeo('Explorar baratonas | Baratona Platform', 'Encontre baratonas públicas por nome e cidade.');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPublicEventsWithBarCountApi()
      .then(setEvents)
      .catch(() => setError('Não foi possível carregar as baratonas.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => !q || e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q));
  }, [events, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-3xl font-bold">Explorar baratonas</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent></Card>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Beer className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma baratona encontrada.</p>
            <Button asChild>
              <Link to="/criar"><Plus className="w-4 h-4 mr-2" /> Criar uma baratona</Link>
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((event) => (
            <Card key={event.id} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {event.description && (
                  <p className="text-muted-foreground line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.city}</span>
                  <span className="flex items-center gap-1"><Beer className="w-3.5 h-3.5" /> {event.barCount} bares</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.memberCount}</span>
                  {event.eventDate && (
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(event.eventDate).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link to={`/baratona/${event.slug}`}>Ver baratona</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
