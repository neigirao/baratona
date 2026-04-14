import { Link, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSeo } from '@/hooks/useSeo';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import NotFound from './NotFound';
import { findEventBySlugApi, getEventBarsApi, joinEventApi, isEventMemberApi, type EventBar } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { MapPin, Clock, Beer, Users, Share2, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EventLanding() {
  const { slug = '' } = useParams();
  const { user } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [bars, setBars] = useState<EventBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const ev = await findEventBySlugApi(slug);
        setEvent(ev);
        if (ev) {
          const eventBars = await getEventBarsApi(ev.id);
          setBars(eventBars);
          if (user) {
            const member = await isEventMemberApi(ev.id, user.id);
            setIsMember(member);
          }
        }
      } catch {
        setError('Erro ao carregar evento.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, user]);

  useSeo(
    event ? `${event.name} | Baratona` : 'Baratona não encontrada',
    event?.description || 'Baratona na plataforma Baratona'
  );

  if (slug === 'nei') return <Navigate to="/nei" replace />;
  if (loading) return <div className="p-8">Carregando...</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;
  if (!event) return <NotFound />;

  const handleJoin = async () => {
    if (!user) {
      toast({ title: 'Faça login para participar', variant: 'destructive' });
      return;
    }
    setJoining(true);
    try {
      await joinEventApi(event.id, user.id, user.user_metadata?.full_name || user.email || 'Participante');
      setIsMember(true);
      toast({ title: 'Você entrou na baratona! 🎉' });
    } catch {
      toast({ title: 'Erro ao entrar no evento', variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/baratona/${event.slug}`;
    if (navigator.share) {
      navigator.share({ title: event.name, text: event.description, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copiado!' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/explorar"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.city}</span>
              <span className="flex items-center gap-1"><Beer className="w-3.5 h-3.5" /> {bars.length} bares</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                {event.visibility === 'public' ? 'Pública' : 'Privada'}
              </span>
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!isMember && (
            <Button onClick={handleJoin} disabled={joining} className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              {joining ? 'Entrando...' : 'Participar'}
            </Button>
          )}
          {isMember && (
            <Button asChild className="flex-1">
              <Link to={`/baratona/${event.slug}/live`}>Abrir evento</Link>
            </Button>
          )}
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
          {user && event.ownerId === user.id && (
            <Button variant="outline" asChild>
              <Link to={`/baratona/${event.slug}/admin`}>Admin</Link>
            </Button>
          )}
        </div>

        {/* Bar list */}
        {bars.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Roteiro</h2>
            <div className="space-y-2">
              {bars.map((bar) => (
                <Card key={bar.id} className="bg-card/60">
                  <CardContent className="py-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {bar.barOrder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{bar.name}</p>
                      {bar.address && <p className="text-sm text-muted-foreground">{bar.address}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {bar.scheduledTime}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card className="bg-card/60">
          <CardContent className="py-4 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Organizador:</strong> {event.ownerName}</p>
            <p><strong className="text-foreground">Tipo:</strong> {event.eventType === 'open_baratona' ? 'Baratona aberta' : 'Circuito especial'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
