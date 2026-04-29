import { Link, Navigate, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSeo } from '@/hooks/useSeo';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import NotFound from './NotFound';
import { findEventBySlugApi, getEventBarsApi, joinEventApi, isEventMemberApi, redeemInviteApi } from '@/lib/platformApi';
import { MapPin, Clock, Beer, Users, Share2, ChevronLeft, Calendar, ExternalLink, KeyRound, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SpecialCircuitLanding } from '@/components/SpecialCircuitLanding';
import { BaratonaHero } from '@/components/BaratonaHero';
import { HighContrastToggle } from '@/components/HighContrastToggle';
import { track } from '@/lib/analytics';
import { LoadError } from '@/components/ui/load-error';
import { EventLandingSkeleton } from '@/components/ui/list-skeletons';

export default function EventLanding() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = usePlatformAuth();
  const queryClient = useQueryClient();
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const inviteCode = params.get('invite');
  const redeemAttempted = useRef(false);
  const viewTracked = useRef(false);

  const eventQuery = useQuery({
    queryKey: ['event', slug],
    queryFn: () => findEventBySlugApi(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
  const event = eventQuery.data ?? null;

  const barsQuery = useQuery({
    queryKey: ['event-bars', event?.id],
    queryFn: () => getEventBarsApi(event!.id),
    enabled: Boolean(event?.id),
    staleTime: 60_000,
  });
  const bars = barsQuery.data ?? [];

  const memberQuery = useQuery({
    queryKey: ['event-member', event?.id, user?.id],
    queryFn: () => isEventMemberApi(event!.id, user!.id),
    enabled: Boolean(event?.id && user?.id),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (memberQuery.data !== undefined) setIsMember(memberQuery.data);
  }, [memberQuery.data]);

  useEffect(() => {
    if (event && !viewTracked.current) {
      viewTracked.current = true;
      track('event_viewed', { event: event.slug, type: event.eventType });
    }
  }, [event]);

  // Auto-redeem invite code from URL once user is logged in
  useEffect(() => {
    if (!user || !event || isMember || !inviteCode || redeemAttempted.current) return;
    redeemAttempted.current = true;
    redeemInviteApi(inviteCode, user.user_metadata?.full_name || user.email || 'Participante')
      .then(() => {
        setIsMember(true);
        queryClient.invalidateQueries({ queryKey: ['event-member', event.id, user.id] });
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
  }, [user, event, isMember, inviteCode, navigate, slug, queryClient]);

  const loading = eventQuery.isLoading || (Boolean(event) && barsQuery.isLoading);
  const error = eventQuery.isError ? 'Erro ao carregar evento.' : null;

  const shareUrl = event ? `${window.location.origin}/baratona/${event.slug}` : undefined;
  const seoDescription = event
    ? event.description ||
      `${event.eventType === 'special_circuit' ? 'Circuito de butecos' : 'Baratona'} em ${event.city} com ${bars.length} ${bars.length === 1 ? 'parada' : 'paradas'}.`
    : 'Baratona na plataforma Baratona';

  const jsonLd = event
    ? {
        '@context': 'https://schema.org',
        '@type': event.eventType === 'special_circuit' ? 'Festival' : 'Event',
        name: event.name,
        description: seoDescription,
        url: shareUrl,
        image: event.coverImageUrl || undefined,
        startDate: event.startDate || event.eventDate || undefined,
        endDate: event.endDate || event.eventDate || undefined,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: bars.slice(0, 20).map((b) => ({
          '@type': 'BarOrPub',
          name: b.name,
          address: b.address || undefined,
          ...(b.latitude && b.longitude
            ? { geo: { '@type': 'GeoCoordinates', latitude: b.latitude, longitude: b.longitude } }
            : {}),
        })),
        organizer: { '@type': 'Person', name: event.ownerName },
        inLanguage: 'pt-BR',
      }
    : null;

  useSeo(
    event ? `${event.name} | Baratona` : 'Baratona não encontrada',
    seoDescription,
    { image: event?.coverImageUrl, url: shareUrl, type: 'article', jsonLd }
  );

  if (slug === 'nei') return <Navigate to="/nei" replace />;
  if (loading) return <EventLandingSkeleton />;
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <LoadError
            title="Não foi possível carregar este evento"
            message="Pode ser uma instabilidade temporária da rede."
            onRetry={() => eventQuery.refetch()}
            retrying={eventQuery.isFetching}
          />
          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link to="/explorar"><ChevronLeft className="w-4 h-4 mr-1" /> Voltar para explorar</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (!event) return <NotFound />;

  const handleJoin = async () => {
    if (!user) {
      track('join_blocked_login', { event: event?.slug });
      toast({ title: 'Faça login para participar', variant: 'destructive' });
      return;
    }
    setJoining(true);
    try {
      await joinEventApi(event.id, user.id, user.user_metadata?.full_name || user.email || 'Participante');
      setIsMember(true);
      queryClient.invalidateQueries({ queryKey: ['event-member', event.id, user.id] });
      track('event_joined', { event: event.slug, type: event.eventType });
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
        subtitle={
          event.description
            ? undefined
            : isCircuit
              ? `Circuito Especial · ${event.city ?? ''}`.replace(/ · $/, '')
              : 'Baratona'
        }
        imageUrl={event.coverImageUrl}
        height="lg"
        asH1
      />
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link to="/explorar" aria-label="Voltar"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 border border-border/50 text-xs sm:text-sm text-muted-foreground flex-wrap justify-center">
              {isCircuit && (
                <span className="text-secondary font-bold uppercase tracking-wide">Circuito</span>
              )}
              {event.city && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.city}</span>
              )}
              <span className="flex items-center gap-1"><Beer className="w-3.5 h-3.5" /> {bars.length} {isCircuit ? 'butecos' : 'bares'}</span>
              {dateLabel && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {dateLabel}</span>
              )}
            </div>
          </div>
          <HighContrastToggle className="flex-shrink-0" />
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

        <footer className="pt-6 mt-2 border-t border-border/40 text-xs text-muted-foreground space-y-1">
          <p>
            <span className="text-foreground/80">Organizador:</span> {event.ownerName} ·{' '}
            <span className="text-foreground/80">Tipo:</span>{' '}
            {isCircuit ? 'Circuito especial (visitação livre)' : 'Baratona aberta'}
          </p>
          {event.externalSourceUrl && (
            <p>
              <span className="text-foreground/80">Fonte oficial:</span>{' '}
              <a href={event.externalSourceUrl} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 underline">
                {new URL(event.externalSourceUrl).hostname} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
