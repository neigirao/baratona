import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EventBar, DishRating } from '@/lib/platformApi';
import { getDishRatingsApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { track } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, ExternalLink, Sparkles, Calendar, MapPin, Trophy } from 'lucide-react';
import { CreateBaratonaFromFavoritesDialog } from './CreateBaratonaFromFavoritesDialog';
import { SelectBarsForBaratonaDialog } from './SelectBarsForBaratonaDialog';
import { CircuitMap } from './CircuitMap';
import { BarDetailDrawer } from './BarDetailDrawer';
import { LoadError } from '@/components/ui/load-error';
import { useSpecialCircuitFavorites } from './special-circuit/useSpecialCircuitFavorites';
import { CircuitFiltersBar, type SortMode, type LayoutMode } from './special-circuit/CircuitFiltersBar';
import { FavoritesStickyBar } from './special-circuit/FavoritesStickyBar';
import { BarGridCard } from './special-circuit/BarGridCard';
import { BarListRow } from './special-circuit/BarListRow';

interface SpecialCircuitLandingProps {
  event: PlatformEvent;
  bars: EventBar[];
}

/* Map a neighborhood to a higher-level "zona" — used for grouping & colors */
function inferZone(neighborhood?: string | null): string {
  if (!neighborhood) return 'Outras';
  const n = neighborhood.toLowerCase();
  if (/(copacabana|ipanema|leblon|botafogo|flamengo|urca|gávea|jardim botânico|humaitá|laranjeiras|catete|glória|leme)/.test(n)) return 'Zona Sul';
  if (/(tijuca|vila isabel|méier|maracanã|grajaú|andaraí|madureira|bonsucesso|penha|engenho|cachambi)/.test(n)) return 'Zona Norte';
  if (/(centro|lapa|santa teresa|cinelândia|saúde|gamboa)/.test(n)) return 'Centro';
  if (/(niter|baixada|caxias|nova iguaçu|são joão|mesquita|nilópolis|belford)/.test(n)) return 'Niterói/Baixada';
  return 'Outras';
}

const ZONE_PIN_COLORS: Record<string, string> = {
  'Zona Sul':        '#A855F7',
  'Centro':          '#F5A623',
  'Zona Norte':      '#2ECC71',
  'Niterói/Baixada': '#3B82F6',
  'Outras':          '#888',
};

function formatDateRange(start?: string | null, end?: string | null, fallback?: string | null) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (fallback) return fmt(fallback);
  return null;
}

function daysRemaining(end?: string | null): number | null {
  if (!end) return null;
  const diff = new Date(end + 'T23:59:59').getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SpecialCircuitLanding({ event, bars }: SpecialCircuitLandingProps) {
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('rating');
  const [layout, setLayout] = useState<LayoutMode>('grid');
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

  const neighborhoodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bars.forEach((b) => { if (b.neighborhood) counts[b.neighborhood] = (counts[b.neighborhood] || 0) + 1; });
    return counts;
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
    } else if (sort === 'neighborhood') {
      list = [...list].sort((a, b) => (a.neighborhood ?? '').localeCompare(b.neighborhood ?? '', 'pt-BR'));
    } else {
      list = [...list].sort((a, b) => a.barOrder - b.barOrder);
    }
    return list;
  }, [bars, search, neighborhood, sort, ratings, onlyFavorites, favorites]);

  // Group by inferred zone (only when no neighborhood filter & grid view)
  const groupedByZone = useMemo(() => {
    if (neighborhood !== 'all' || layout !== 'grid' || sort !== 'rating') return null;
    const groups: Record<string, EventBar[]> = {};
    filteredBars.forEach((b) => {
      const z = inferZone(b.neighborhood);
      (groups[z] = groups[z] || []).push(b);
    });
    const order = ['Zona Sul', 'Centro', 'Zona Norte', 'Niterói/Baixada', 'Outras'];
    return order.filter((z) => groups[z]?.length).map((z) => [z, groups[z]] as const);
  }, [filteredBars, neighborhood, layout, sort]);

  const selectedBarsOrdered = useMemo(() => {
    const byId = new Map(bars.map((b) => [b.id, b] as const));
    return favOrder.map((id) => byId.get(id)).filter((b): b is EventBar => Boolean(b));
  }, [bars, favOrder]);

  const favCount = favorites.size;
  const total = bars.length;
  const visited = favCount; // platform proxy — favorites act as "marked" baseline
  const dateLabel = formatDateRange(event.startDate, event.endDate, event.eventDate);
  const daysLeft = daysRemaining(event.endDate);
  const progressPct = total > 0 ? Math.round((visited / total) * 100) : 0;

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
    <section className="space-y-6">
      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-primary/20 relative"
        style={{ background: 'linear-gradient(135deg, #1C0E00 0%, #2E1800 40%, #1A0E00 100%)' }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.08), transparent 50%), radial-gradient(circle at 80% 30%, hsl(var(--primary-dark) / 0.06), transparent 50%)',
          }}
        />

        <div className="relative p-6 sm:p-8 lg:p-10 flex gap-6 sm:gap-12 items-center flex-wrap">
          <img
            src="/assets/comida-di-buteco-logo.png"
            alt={event.name}
            className="flex-shrink-0 object-contain"
            style={{
              width: 'clamp(120px, 15vw, 180px)',
              height: 'clamp(120px, 15vw, 180px)',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))',
            }}
          />

          <div className="flex-1 min-w-[240px]">
            <div className="flex gap-2 mb-3.5 flex-wrap items-center">
              <span className="text-[11px] font-bold tracking-wide text-primary bg-primary/15 border border-primary/25 px-3 py-0.5 rounded-full">
                Circuito Especial
              </span>
              <span className="text-[11px] font-semibold text-success bg-success/10 border border-success/20 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-success rounded-full" style={{ boxShadow: '0 0 6px hsl(var(--success))' }} />
                Ativo agora
              </span>
            </div>
            <h1
              className="font-heading font-extrabold text-foreground leading-tight mb-2.5"
              style={{ fontSize: 'clamp(26px, 3.5vw, 44px)' }}
            >
              {event.name}
            </h1>
            {event.description && (
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-5 max-w-[460px]">
                {event.description}
              </p>
            )}
            <div className="flex gap-6 flex-wrap text-[13px] text-muted-foreground">
              {dateLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {dateLabel}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {event.city}
              </span>
              {total > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> {total} bares
                </span>
              )}
            </div>
          </div>

          {/* Vertical stats — desktop only */}
          <div className="hidden lg:flex flex-col gap-2 flex-shrink-0">
            {[
              { val: total, label: 'bares', color: 'text-primary' },
              { val: favCount, label: 'marcados', color: 'text-success' },
              { val: daysLeft != null ? `${daysLeft}d` : '—', label: 'restam', color: 'text-muted-foreground' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-5 py-2.5 text-center min-w-[90px] backdrop-blur-sm border border-white/5"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <p className={`font-heading font-extrabold text-2xl leading-none ${s.color}`}>{s.val}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS GRID + PROGRESS ──────────────────────────────── */}
      <div className="space-y-5">
        <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <StatCard val={total} label="Bares participantes" sub="neste circuito" />
          <StatCard val={favCount} label="Você marcou" sub={`${progressPct}% do circuito`} accent />
          <StatCard val={total - favCount} label="Ainda faltam" sub="bares pra marcar" />
          <StatCard
            val={daysLeft != null ? `${daysLeft} dias` : '—'}
            label="Tempo restante"
            sub={event.endDate ? `até ${formatDateRange(event.endDate)}` : '—'}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Seu progresso no circuito</span>
            <span className="text-xs font-semibold text-success">
              {favCount} de {total} marcados
            </span>
          </div>
          <div className="h-1.5 bg-card border border-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, hsl(var(--success)), hsl(145 63% 65%))',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── MAP ────────────────────────────────────────────────── */}
      {(ratingsQuery.isError || countsQuery.isError) && (
        <LoadError
          compact
          title="Avaliações indisponíveis"
          message="Os bares estão visíveis, mas notas e marcações não carregaram."
          onRetry={() => { ratingsQuery.refetch(); countsQuery.refetch(); }}
          retrying={ratingsQuery.isFetching || countsQuery.isFetching}
        />
      )}

      <CircuitMap
        bars={bars}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* ── CTA + filters ──────────────────────────────────────── */}
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

      <CircuitFiltersBar
        search={search}
        onSearch={setSearch}
        neighborhood={neighborhood}
        onNeighborhood={setNeighborhood}
        neighborhoods={neighborhoods}
        zoneCounts={neighborhoodCounts}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => setOnlyFavorites((v) => !v)}
        favCount={favCount}
        sort={sort}
        onSort={setSort}
        layout={layout}
        onLayout={setLayout}
      />

      <p className="text-[13px] text-muted-foreground">
        {filteredBars.length} bares
        {neighborhood !== 'all' ? ` em ${neighborhood}` : ''}
        {search && ` · buscando "${search}"`}
      </p>

      {/* ── RESULTS ────────────────────────────────────────────── */}
      {layout === 'grid' ? (
        groupedByZone ? (
          <div className="space-y-12">
            {groupedByZone.map(([zone, items]) => (
              <div key={zone}>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: ZONE_PIN_COLORS[zone], boxShadow: `0 0 8px ${ZONE_PIN_COLORS[zone]}66` }}
                  />
                  <h2 className="font-heading text-base font-bold text-muted-foreground">{zone}</h2>
                  <span className="text-xs text-muted-foreground/60">{items.length} bares</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((bar) => (
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
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        )
      ) : (
        <div className="bg-background-2 border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex gap-4 items-center text-[11px] uppercase tracking-wide text-muted-foreground/60">
            <span className="min-w-6" />
            <span className="w-11" />
            <span className="flex-1">Bar</span>
            <span className="mr-[110px]">Score</span>
          </div>
          {filteredBars.map((bar, i) => (
            <BarListRow
              key={bar.id}
              bar={bar}
              rank={i + 1}
              zone={inferZone(bar.neighborhood)}
              rating={ratings[bar.id || '']}
              isFavorite={favorites.has(bar.id || '')}
              onToggleFavorite={toggleFavorite}
              onOpenDetail={setActiveBarId}
            />
          ))}
        </div>
      )}

      {filteredBars.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🍺</div>
          <p className="text-base mb-2">Nenhum bar encontrado</p>
          <p className="text-sm">Tente outro filtro ou busca</p>
        </div>
      )}

      {/* Dialogs / drawer */}
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

function StatCard({ val, label, sub, accent }: { val: string | number; label: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3.5">
      <p className={`font-heading font-extrabold text-2xl leading-tight mb-0.5 ${accent ? 'text-success' : 'text-primary'}`}>
        {val}
      </p>
      <p className="text-[13px] font-semibold text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
