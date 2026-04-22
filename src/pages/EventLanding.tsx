import { Link, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSeo } from '@/hooks/useSeo';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import NotFound from './NotFound';
import { findEventBySlugApi, getEventBarsApi, joinEventApi, isEventMemberApi, redeemInviteApi, type EventBar } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { MapPin, Clock, Beer, Users, Share2, ChevronLeft, Calendar, ExternalLink, KeyRound, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SpecialCircuitLanding } from '@/components/SpecialCircuitLanding';
import { BaratonaHero } from '@/components/BaratonaHero';

export default function EventLanding() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = usePlatformAuth();
  const [event, setEvent] = useState<PlatformEvent | null>(null);
  const [bars, setBars] = useState<EventBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const inviteCode = params.get('invite');
  const redeemAttempted = useRef(false);

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

  useEffect(() => {
    if (!user || !event || isMember || !inviteCode || redeemAttempted.current) return;
    redeemAttempted.current = true;
    redeemInviteApi(inviteCode, user.user_metadata?.full_name || user.email || 'Participante')
      .then(() => {
        setIsMember(true);
        toast({ title: 'Você entrou na baratona! 🎉' });
        navigate(`/baratona/${slug}`, { replace: true });
      })
      .catch((err) => {
        toast({
          title: 'Convite inválido',
          description: err instanceof Error ? err.message : 'Tente novamente',
          variant: 'destructive',
        });
      });
  }, [user, event, isMember, inviteCode, navigate, slug]);

  const shareUrl = event ? `${window.location.origin}/baratona/${event.slug}` : undefined;
  const seoDescription = event
    ? event.description ||
      `${event.eventType === 'special_circuit' ? 'Circuito de butecos' : 'Baratona'} em ${event.city} com ${bars.length} ${bars.length === 1 ? 'parada' : 'paradas'}.`
    : 'Baratona na plataforma Baratona';
  useSeo(
    event ? `${event.name} | Baratona` : 'Baratona não encontrada',
    seoDescription,
    { image: event?.coverImageUrl, url: shareUrl, type: 'article' }
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

  const handleShare = async () => {
    if (!event) return;
    const url = shareUrl!;
    const shareText = `${event.name} — ${event.city}${event.description ? ` · ${event.description.slice(0, 120)}` : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.name, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copiado!', description: url });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copiado!', description: url });
      } catch {
        toast({ title: 'Não foi possível compartilhar', variant: 'destructive' });
      }
    }
  };

  const isCircuit = event.eventType === 'special_circuit';
  const dateLabel = (() => {
    if (isCircuit && (event.startDate || event.endDate)) {
      const fmt = (d?: string | null) =>
        d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '';
      const start = fmt(event.startDate);
      const end = fmt(event.endDate);
      if (start && end) return `${start} – ${end}`;
      return start || end;
    }
    if (event.eventDate) {
      return new Date(event.eventDate + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-background">
      <BaratonaHero
        title={event.name}
        subtitle={event.description ? undefined : (isCircuit ? 'Circuito Especial' : 'Baratona')}
        imageUrl={event.coverImageUrl}
        height="lg"
        asH1
      />
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/explorar"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            {isCircuit && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-bold uppercase mb-1">
                Circuito Especial
              </span>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.city}</span>
              <span className="flex items-center gap-1"><Beer className="w-3.5 h-3.5" /> {bars.length} {isCircuit ? 'butecos' : 'bares'}</span>
              {dateLabel && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {dateLabel}</span>
              )}
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        )}

        <div className="flex gap-2 flex-wrap">
          {!isMember && (
            <Button onClick={handleJoin} disabled={joining} className="flex-1 min-w-[140px]">
              <Users className="w-4 h-4 mr-2" />
              {joining ? 'Entrando...' : 'Participar'}
            </Button>
          )}
          {isMember && (
            <Button asChild className="flex-1 min-w-[140px]">
              <Link to={`/baratona/${event.slug}/live`}>
                {isCircuit ? 'Abrir circuito' : 'Abrir evento'}
              </Link>
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

        {isCircuit ? (
          <SpecialCircuitLanding event={event} bars={bars} />
        ) : (
          bars.length > 0 && (
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
                      {bar.scheduledTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          {bar.scheduledTime}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        )}

        <Card className="bg-card/60">
          <CardContent className="py-4 text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Organizador:</strong> {event.ownerName}</p>
            <p><strong className="text-foreground">Tipo:</strong> {isCircuit ? 'Circuito especial (visitação livre)' : 'Baratona aberta'}</p>
            {event.externalSourceUrl && (
              <p>
                <strong className="text-foreground">Fonte oficial:</strong>{' '}
                <a href={event.externalSourceUrl} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 underline">
                  {new URL(event.externalSourceUrl).hostname} <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
