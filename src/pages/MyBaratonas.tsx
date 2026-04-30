import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadError } from '@/components/ui/load-error';
import { useSeo } from '@/hooks/useSeo';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { listEventsByOwnerApi, listEventsJoinedByUserApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { ChevronLeft, Plus, Beer, MapPin, Users, Crown, UserCheck, Lock, Globe } from 'lucide-react';

type EnrichedOwned = PlatformEvent & { barCount: number; memberCount: number };
type EnrichedJoined = EnrichedOwned & { role: string };

export default function MyBaratonas() {
  const { user, loading: authLoading, signInWithGoogle } = usePlatformAuth();
  useSeo('Minhas baratonas | Baratona', 'Eventos que você criou e baratonas em que está participando.');

  const ownedQuery = useQuery({
    queryKey: ['my-events-owned', user?.id],
    queryFn: () => listEventsByOwnerApi(user!.id),
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: 1,
  });
  const joinedQuery = useQuery({
    queryKey: ['my-events-joined', user?.id],
    queryFn: () => listEventsJoinedByUserApi(user!.id),
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: 1,
  });

  const owned: EnrichedOwned[] | null = ownedQuery.data ?? null;
  const joined = useMemo<EnrichedJoined[] | null>(() => {
    if (!joinedQuery.data) return null;
    const ownedIds = new Set((owned ?? []).map((e) => e.id));
    return joinedQuery.data.filter((e) => !ownedIds.has(e.id));
  }, [joinedQuery.data, owned]);

  const hasError = ownedQuery.isError || joinedQuery.isError;
  const refetching = ownedQuery.isFetching || joinedQuery.isFetching;
  const refetchAll = () => {
    ownedQuery.refetch();
    joinedQuery.refetch();
  };

  if (authLoading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto px-4 py-16 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 text-primary">
            <Beer className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Minhas baratonas</h1>
          <p className="text-muted-foreground">
            Faça login para ver as baratonas que você criou e em que está participando.
          </p>
          <Button onClick={signInWithGoogle} size="lg" className="font-bold">
            Entrar com Google
          </Button>
          <div>
            <Button asChild variant="ghost">
              <Link to="/"><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const loading = owned === null || joined === null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Minhas baratonas</h1>
            <p className="text-sm text-muted-foreground">Eventos que você criou e em que participa.</p>
          </div>
          <Button asChild size="sm" className="font-bold">
            <Link to="/criar"><Plus className="w-4 h-4 mr-1" /> Criar</Link>
          </Button>
        </div>

        {hasError && (
          <LoadError
            title="Não foi possível carregar suas baratonas"
            onRetry={refetchAll}
            retrying={refetching}
            compact
          />
        )}

        <Section
          title="Que você criou"
          icon={<Crown className="w-4 h-4" />}
          loading={loading}
          events={owned || []}
          emptyMessage="Você ainda não criou nenhuma baratona."
          emptyAction={
            <Button asChild>
              <Link to="/criar"><Plus className="w-4 h-4 mr-1" /> Criar minha primeira</Link>
            </Button>
          }
          showOwnerBadge
        />

        <Section
          title="Que você participa"
          icon={<UserCheck className="w-4 h-4" />}
          loading={loading}
          events={joined || []}
          emptyMessage="Você ainda não entrou em nenhuma baratona criada por outras pessoas."
          emptyAction={
            <Button asChild variant="outline">
              <Link to="/explorar">Explorar baratonas</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}

const SECTION_PAGE_SIZE = 8;

function Section({
  title,
  icon,
  loading,
  events,
  emptyMessage,
  emptyAction,
  showOwnerBadge,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  events: EnrichedOwned[];
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  showOwnerBadge?: boolean;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(events.length / SECTION_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = events.slice((safePage - 1) * SECTION_PAGE_SIZE, safePage * SECTION_PAGE_SIZE);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
        {icon}
        {title}
        {!loading && <span className="text-xs font-normal">({events.length})</span>}
      </h2>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : events.length === 0 ? (
        <Card className="bg-card/40 border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            {emptyAction}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            {paginated.map((e) => (
              <EventCard key={e.id} event={e} showOwnerBadge={showOwnerBadge} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">{safePage}/{totalPages}</span>
              <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function EventCard({ event, showOwnerBadge }: { event: EnrichedOwned; showOwnerBadge?: boolean }) {
  const isCircuit = event.eventType === 'special_circuit';
  return (
    <Link to={`/baratona/${event.slug}`}>
      <Card className="bg-card/60 hover:border-primary/40 transition-colors h-full">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2">{event.name}</h3>
            <span
              className={`text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1 flex-shrink-0 ${
                event.visibility === 'private'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {event.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {event.visibility === 'private' ? 'Privada' : 'Pública'}
            </span>
          </div>
          {showOwnerBadge && (
            <span className="inline-flex items-center gap-1 text-xs text-secondary font-semibold">
              <Crown className="w-3 h-3" /> {isCircuit ? 'Organizador do circuito' : 'Organizador'}
            </span>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.city}</span>
            <span className="flex items-center gap-1"><Beer className="w-3 h-3" /> {event.barCount}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.memberCount}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
