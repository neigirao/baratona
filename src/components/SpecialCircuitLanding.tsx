import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EventBar, DishRating } from '@/lib/platformApi';
import { getDishRatingsApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { track } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, ExternalLink, Sparkles } from 'lucide-react';
import { CreateBaratonaFromFavoritesDialog } from './CreateBaratonaFromFavoritesDialog';
import { SelectBarsForBaratonaDialog } from './SelectBarsForBaratonaDialog';
import { CircuitMap } from './CircuitMap';
import { BarDetailDrawer } from './BarDetailDrawer';
import { LoadError } from '@/components/ui/load-error';
import { useSpecialCircuitFavorites } from './special-circuit/useSpecialCircuitFavorites';
import { CircuitFiltersBar, type SortMode } from './special-circuit/CircuitFiltersBar';
import { FavoritesStickyBar } from './special-circuit/FavoritesStickyBar';
import { BarGridCard } from './special-circuit/BarGridCard';

interface SpecialCircuitLandingProps {
  event: PlatformEvent;
  bars: EventBar[];
}

export function SpecialCircuitLanding({ event, bars }: SpecialCircuitLandingProps) {
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('order');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [activeBarId, setActiveBarId] = useState<string | null>(null);

  const ratingsQuery = useQuery({
    queryKey: ['dish-ratings', event.id],
    queryFn: () => getDishRatingsApi(event.id),
    staleTime: 60_000,
  });
  const ratings: Record<string, DishRating> = ratingsQuery.data ?? {};

  const {
    favorites, favOrder, setFavOrder, favCounts, countsQuery,
    toggleFavorite, shareFavorites,
  } = useSpecialCircuitFavorites(event, bars);

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    bars.forEach((b) => b.neighborhood && set.add(b.neighborhood));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [bars]);

  const filteredBars = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = bars.filter((b) => {
      if (onlyFavorites && !favorites.has(b.id || '')) return false;
      if (neighborhood !== 'all' && b.neighborhood !== neighborhood) return false;
      if (!term) return true;
      return (
        b.name.toLowerCase().includes(term) ||
        (b.featuredDish?.toLowerCase().includes(term) ?? false) ||
        (b.neighborhood?.toLowerCase().includes(term) ?? false)
      );
    });

    if (sort === 'rating') {
      list = [...list].sort((a, b) => {
        const ra = ratings[a.id || '']?.averageScore ?? -1;
        const rb = ratings[b.id || '']?.averageScore ?? -1;
        return rb - ra;
      });
    } else if (sort === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      list = [...list].sort((a, b) => a.barOrder - b.barOrder);
    }
    return list;
  }, [bars, search, neighborhood, sort, ratings, onlyFavorites, favorites]);

  const selectedBarsOrdered = useMemo(() => {
    const byId = new Map(bars.map((b) => [b.id, b] as const));
    return favOrder.map((id) => byId.get(id)).filter((b): b is EventBar => Boolean(b));
  }, [bars, favOrder]);

  const favCount = favorites.size;

  if (bars.length === 0) {
    return (
      <Card className="bg-card/60">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Utensils className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Os butecos participantes serão divulgados em breve.</p>
          {event.externalSourceUrl && (
            <a
              href={event.externalSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary mt-3 text-sm underline"
            >
              Ver no site oficial <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          Petiscos em concurso
        </h2>
        <span className="text-sm text-muted-foreground">
          {filteredBars.length} de {bars.length}
        </span>
      </div>

      <Button
        onClick={() => {
          track('create_baratona_select_dialog_opened', { event: event.slug, total: bars.length });
          setSelectOpen(true);
        }}
        className="w-full"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Crie sua baratona com esses bares
      </Button>

      <FavoritesStickyBar
        favCount={favCount}
        onShare={shareFavorites}
        onCreate={() => {
          track('create_baratona_dialog_opened', { event: event.slug, count: favCount });
          setCreateOpen(true);
        }}
      />

      {(ratingsQuery.isError || countsQuery.isError) && (
        <LoadError
          compact
          title="Avaliações indisponíveis"
          message="Os bares estão visíveis, mas notas e marcações não carregaram."
          onRetry={() => {
            ratingsQuery.refetch();
            countsQuery.refetch();
          }}
          retrying={ratingsQuery.isFetching || countsQuery.isFetching}
        />
      )}

      <CircuitMap
        bars={filteredBars}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        hideViewToggle
        totalCount={bars.length}
      />

      <CircuitFiltersBar
        search={search}
        onSearch={setSearch}
        neighborhood={neighborhood}
        onNeighborhood={setNeighborhood}
        neighborhoods={neighborhoods}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => setOnlyFavorites((v) => !v)}
        favCount={favCount}
        sort={sort}
        onSort={setSort}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredBars.map((bar) => (
          <BarGridCard
            key={bar.id}
            bar={bar}
            rating={ratings[bar.id || '']}
            isFavorite={favorites.has(bar.id || '')}
            favoriteCount={favCounts[bar.id || ''] || 0}
            onToggleFavorite={toggleFavorite}
            onOpenDetail={setActiveBarId}
          />
        ))}
      </div>

      <CreateBaratonaFromFavoritesDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sourceEventId={event.id}
        selectedBars={selectedBarsOrdered}
        onRemove={(barId) => toggleFavorite(barId)}
        onReorder={(ids) => setFavOrder(ids)}
        defaultName={`Minha rota ${event.name}`}
      />

      <SelectBarsForBaratonaDialog
        open={selectOpen}
        onOpenChange={setSelectOpen}
        sourceEventId={event.id}
        sourceEventSlug={event.slug}
        bars={bars}
        preselectedIds={favOrder}
        defaultName={`Minha rota ${event.name}`}
      />

      <BarDetailDrawer
        bar={bars.find((b) => b.id === activeBarId) ?? null}
        open={Boolean(activeBarId)}
        onOpenChange={(o) => { if (!o) setActiveBarId(null); }}
        rating={activeBarId ? ratings[activeBarId] : undefined}
        favoriteCount={activeBarId ? favCounts[activeBarId] || 0 : 0}
        isFavorite={activeBarId ? favorites.has(activeBarId) : false}
        onToggleFavorite={toggleFavorite}
        eventSlug={event.slug}
      />
    </section>
  );
}
