import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type PlatformEvent } from '@/lib/platformEvents';
import { listPublicEventsApi } from '@/lib/platformApi';
import { useSeo } from '@/hooks/useSeo';

export default function Explore() {
  useSeo('Explorar baratonas | Baratona Platform', 'Encontre baratonas públicas por nome e cidade.');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPublicEventsApi()
      .then(setEvents)
      .catch(() => setError('Não foi possível carregar as baratonas.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => !q || e.name.toLowerCase().includes(q) || e.city.toLowerCase().includes(q));
  }, [events, search]);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-3xl font-bold">Explorar baratonas</h1>
      <Input placeholder="Buscar por nome ou cidade" value={search} onChange={(e) => setSearch(e.target.value)} />
      {loading && <p className="text-sm text-muted-foreground">Carregando eventos...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{event.description}</p>
              <p>{event.city}</p>
              <Button asChild><Link to={`/baratona/${event.slug}`}>Ver baratona</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
