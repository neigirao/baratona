import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import NotFound from './NotFound';
import { findEventBySlugApi, getEventBarsApi, type EventBar } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { ChevronLeft, Settings, Beer, Users } from 'lucide-react';

export default function EventAdmin() {
  const { slug = '' } = useParams();
  const { user, loading } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [bars, setBars] = useState<EventBar[]>([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('Erro ao carregar evento.');
      } finally {
        setEventLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading || eventLoading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!event) return <NotFound />;
  if (!user || event.ownerId !== user.id) {
    return (
      <div className="container max-w-xl mx-auto p-10 space-y-3">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-muted-foreground">Somente o organizador pode acessar esse painel.</p>
        <Button asChild variant="outline"><Link to={`/baratona/${slug}`}>Voltar ao evento</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/baratona/${slug}`}><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Admin — {event.name}
            </h1>
            <p className="text-xs text-muted-foreground">{event.city} · {event.visibility === 'public' ? 'Público' : 'Privado'}</p>
          </div>
        </div>

        {/* Event summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="py-4 text-center">
            <Beer className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{bars.length}</p>
            <p className="text-xs text-muted-foreground">Bares no roteiro</p>
          </CardContent></Card>
          <Card><CardContent className="py-4 text-center">
            <Users className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Participantes</p>
          </CardContent></Card>
        </div>

        {/* Bar list */}
        <section className="space-y-2">
          <h2 className="font-semibold">Bares</h2>
          {bars.map((bar) => (
            <Card key={bar.id} className="bg-card/60">
              <CardContent className="py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">{bar.barOrder}</span>
                <span className="font-medium text-sm">{bar.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{bar.scheduledTime}</span>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <p>O painel completo de administração em tempo real (controle de status, broadcast, retrospectiva) estará disponível em breve para eventos criados na plataforma.</p>
            <p className="mt-2">Para o evento legado, acesse <Link to="/nei" className="text-primary underline">/nei</Link>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
