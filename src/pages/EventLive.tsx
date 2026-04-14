import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { findEventBySlugApi, getEventBarsApi, type EventBar } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import NotFound from './NotFound';
import { Beer, MapPin, Clock, ChevronLeft } from 'lucide-react';

export default function EventLive() {
  const { slug = '' } = useParams();
  const { user } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [bars, setBars] = useState<EventBar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ev = await findEventBySlugApi(slug);
        setEvent(ev);
        if (ev) {
          const b = await getEventBarsApi(ev.id);
          setBars(b);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!event) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/baratona/${slug}`}><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{event.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {event.city} · {bars.length} bares
            </p>
          </div>
        </div>

        {/* Status banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 text-center space-y-2">
            <Beer className="w-8 h-8 mx-auto text-primary" />
            <p className="font-semibold">Modo ao vivo em breve</p>
            <p className="text-sm text-muted-foreground">
              O modo ao vivo com check-in, consumo, votação e mapa estará disponível em breve.
              Por enquanto, confira o roteiro abaixo.
            </p>
          </CardContent>
        </Card>

        {/* Bar list */}
        <section className="space-y-2">
          <h2 className="font-semibold text-lg">Roteiro</h2>
          {bars.map((bar) => (
            <Card key={bar.id} className="bg-card/60">
              <CardContent className="py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {bar.barOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{bar.name}</p>
                  {bar.address && <p className="text-xs text-muted-foreground">{bar.address}</p>}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {bar.scheduledTime}
                </span>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
