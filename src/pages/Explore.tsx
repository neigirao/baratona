import { Link, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadError } from '@/components/ui/load-error';
import { EventCardSkeletonGrid } from '@/components/ui/list-skeletons';
import { type PlatformEvent } from '@/lib/platformEvents';
import { listPublicEventsWithBarCountApi } from '@/lib/platformApi';
import { useSeo } from '@/hooks/useSeo';
import { MapPin, Beer, ChevronLeft, Search, Plus, Users, Calendar, Link2 } from 'lucide-react';
import { PLATFORM_BASE_URL } from '@/lib/constants';
import { toast } from 'sonner';

type EnrichedEvent = PlatformEvent & { barCount: number; memberCount: number };
type FilterType = 'all' | 'open_baratona' | 'special_circuit';

export default function Explore() {
  useSeo(
    'Explorar baratonas e circuitos | Baratona',
    'Descubra baratonas públicas e circuitos especiais de butecos. Filtre por nome, cidade e tipo de evento.',
    {
      image: `${PLATFORM_BASE_URL}/og-explore.jpg`,
      url: `${PLATFORM_BASE_URL}/explorar`,
      type: 'website',
      locale: 'pt_BR',
      keywords: 'explorar baratonas, circuitos de butecos, eventos de bar, rota gastronômica',
    }
  );
  const PAGE_SIZE = 12;
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeRaw = searchParams.get('type');
  const typeFilter: FilterType =
    typeRaw === 'open_baratona' || typeRaw === 'special_circuit' ? typeRaw : 'all';
  const pageRaw = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const updateParams = (patch: Partial<{ q: string; type: FilterType; page: number }>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if ('q' in patch) {
          if (patch.q) next.set('q', patch.q);
          else next.delete('q');
        }
        if ('type' in patch) {
          if (patch.type && patch.type !== 'all') next.set('type', patch.type);
          else next.delete('type');
        }
        if ('page' in patch) {
          if (patch.page && patch.page > 1) next.set('page', String(patch.page));
          else next.delete('page');
        }
        return next;
      },
      { replace: true },
    );
  };

  const setSearch = (q: string) => updateParams({ q, page: 1 });
  const setTypeFilter = (type: FilterType) => updateParams({ type, page: 1 });
  const setPage = (updater: number | ((p: number) => number)) => {
    const next = typeof updater === 'function' ? updater(page) : updater;
    updateParams({ page: next });
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado! Filtros e página preservados.', { duration: 2500 });
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const eventsQuery = useQuery({
    queryKey: ['public-events'],
    queryFn: listPublicEventsWithBarCountApi,
    staleTime: 60_000,
    retry: 1,
  });
  const events: EnrichedEvent[] = eventsQuery.data ?? [];
  const loading = eventsQuery.isLoading;
  const error = eventsQuery.isError;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (typeFilter !== 'all' && e.eventType !== typeFilter) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.city.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, search, typeFilter]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Voltar"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Explorar</h1>
            <p className="text-sm text-foreground-2">Baratonas e circuitos especiais abertos.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCopyLink} aria-label="Copiar link" className="text-foreground-2 hover:text-primary">
            <Link2 className="w-5 h-5" />
          </Button>
          <Button asChild variant="gold-outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/minhas-baratonas">Minhas baratonas</Link>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-2" />
          <Input
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background-2 border-border focus-visible:ring-primary/40"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'all', label: 'Todos' },
            { id: 'open_baratona', label: 'Baratonas' },
            { id: 'special_circuit', label: 'Circuitos especiais' },
          ] as { id: FilterType; label: string }[]).map((opt) => (
            <Button
              key={opt.id}
              size="sm"
              variant={typeFilter === opt.id ? 'gold' : 'gold-outline'}
              onClick={() => setTypeFilter(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {loading && <EventCardSkeletonGrid count={4} />}

        {error && (
          <LoadError
            title="Não foi possível carregar as baratonas"
            message="Verifique sua conexão e tente novamente."
            onRetry={() => eventsQuery.refetch()}
            retrying={eventsQuery.isFetching}
          />
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 space-y-4 border border-dashed border-border rounded-2xl bg-background-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <Beer className="w-8 h-8" />
            </div>
            <p className="text-foreground-2">Nenhum evento encontrado.</p>
            <Button asChild variant="gold">
              <Link to="/criar"><Plus className="w-4 h-4 mr-2" /> Criar uma baratona</Link>
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {paginated.map((event) => {
            const isCircuit = event.eventType === 'special_circuit';
            return (
              <Card key={event.id} className="bg-card border-border hover:border-primary/50 hover:shadow-gold-md transition-all duration-ui overflow-hidden group">
                {event.coverImageUrl && (
                  <div className="aspect-[16/7] bg-muted overflow-hidden">
                    <img src={event.coverImageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-page" loading="lazy" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-heading text-lg leading-tight text-foreground">{event.name}</CardTitle>
                    {isCircuit && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        Circuito
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {event.description && (
                    <p className="text-foreground-2 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-foreground-2 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> {event.city}</span>
                    <span className="flex items-center gap-1"><Beer className="w-3.5 h-3.5 text-primary" /> {event.barCount} {isCircuit ? 'butecos' : 'bares'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary" /> {event.memberCount}</span>
                    {event.eventDate && (
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(event.eventDate).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  <Button asChild variant="gold" size="sm">
                    <Link to={`/baratona/${event.slug}`}>Ver detalhes</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              size="sm"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
