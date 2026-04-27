import { useMemo, useState } from 'react';
import type { EventBar } from '@/lib/platformApi';
import { Button } from '@/components/ui/button';
import { MapPin, Bookmark, Maximize2 } from 'lucide-react';

interface CircuitMapProps {
  bars: EventBar[];
  favorites: Set<string>;
  onToggleFavorite?: (barId: string) => void;
  hideViewToggle?: boolean;
  totalCount?: number;
}

type ViewMode = 'all' | 'favorites';

function getBboxUrl(bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const padLat = Math.max((bbox.maxLat - bbox.minLat) * 0.15, 0.005);
  const padLng = Math.max((bbox.maxLng - bbox.minLng) * 0.15, 0.005);
  const left = bbox.minLng - padLng;
  const right = bbox.maxLng + padLng;
  const bottom = bbox.minLat - padLat;
  const top = bbox.maxLat + padLat;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik`;
}

function buildMultiStopUrl(bars: EventBar[]) {
  const stops = bars
    .filter((b) => b.name && b.address)
    .map((b) => encodeURIComponent(`${b.name}, ${b.address}`))
    .join('/');
  return `https://www.google.com/maps/dir/${stops}`;
}

export function CircuitMap({ bars, favorites, onToggleFavorite, hideViewToggle, totalCount }: CircuitMapProps) {
  const [view, setView] = useState<ViewMode>('all');

  const barsWithCoords = useMemo(
    () => bars.filter((b) => b.id && b.latitude != null && b.longitude != null),
    [bars]
  );

  const favCount = useMemo(
    () => barsWithCoords.filter((b) => favorites.has(b.id || '')).length,
    [barsWithCoords, favorites]
  );

  const visibleBars = useMemo(() => {
    if (view === 'favorites') {
      return barsWithCoords.filter((b) => favorites.has(b.id || ''));
    }
    return barsWithCoords;
  }, [view, barsWithCoords, favorites]);

  const bbox = useMemo(() => {
    const source = visibleBars.length > 0 ? visibleBars : barsWithCoords;
    if (source.length === 0) return null;
    const lats = source.map((b) => b.latitude as number);
    const lngs = source.map((b) => b.longitude as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    // Avoid degenerate bbox when only one point
    const latPad = maxLat === minLat ? 0.01 : 0;
    const lngPad = maxLng === minLng ? 0.01 : 0;
    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad,
    };
  }, [visibleBars, barsWithCoords]);

  // SVG overlay padding must match getBboxUrl padding (15%) so pins align with iframe
  const overlayBbox = useMemo(() => {
    if (!bbox) return null;
    const padLat = Math.max((bbox.maxLat - bbox.minLat) * 0.15, 0.005);
    const padLng = Math.max((bbox.maxLng - bbox.minLng) * 0.15, 0.005);
    return {
      minLat: bbox.minLat - padLat,
      maxLat: bbox.maxLat + padLat,
      minLng: bbox.minLng - padLng,
      maxLng: bbox.maxLng + padLng,
    };
  }, [bbox]);

  function project(lat: number, lng: number) {
    if (!overlayBbox) return { x: 0, y: 0 };
    const xPct = ((lng - overlayBbox.minLng) / (overlayBbox.maxLng - overlayBbox.minLng)) * 100;
    // y is inverted (lat increases upward, but pixels increase downward)
    const yPct = ((overlayBbox.maxLat - lat) / (overlayBbox.maxLat - overlayBbox.minLat)) * 100;
    return { x: xPct, y: yPct };
  }

  if (barsWithCoords.length === 0) {
    return (
      <div className="bar-card p-4 text-sm text-muted-foreground">
        Mapa indisponível (nenhum bar com coordenadas).
      </div>
    );
  }

  const embedUrl = bbox ? getBboxUrl(bbox) : null;
  const routeUrl = visibleBars.length >= 2 ? buildMultiStopUrl(visibleBars) : null;

  return (
    <section className="bar-card overflow-hidden" aria-label="Mapa do circuito">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Mapa do circuito</h2>
        <span className="text-xs text-muted-foreground ml-auto">
          {visibleBars.length} de {barsWithCoords.length} no mapa
        </span>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        <Button
          size="sm"
          variant={view === 'all' ? 'default' : 'outline'}
          onClick={() => setView('all')}
          className="h-8 text-xs"
        >
          <MapPin className="w-3.5 h-3.5 mr-1" />
          Mostrar todos ({barsWithCoords.length})
        </Button>
        <Button
          size="sm"
          variant={view === 'favorites' ? 'default' : 'outline'}
          onClick={() => setView('favorites')}
          disabled={favCount === 0}
          className="h-8 text-xs"
        >
          <Bookmark className={`w-3.5 h-3.5 mr-1 ${view === 'favorites' ? 'fill-current' : ''}`} />
          Só marcados ({favCount})
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden h-72 relative border border-border bg-muted">
        {embedUrl && (
          <iframe
            title="Mapa do circuito"
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        {/* SVG overlay with colored pins */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {visibleBars.map((bar) => {
              const { x, y } = project(bar.latitude as number, bar.longitude as number);
              const isFav = favorites.has(bar.id || '');
              return (
                <g key={bar.id} transform={`translate(${x} ${y})`}>
                  {/* Halo for fav */}
                  {isFav && (
                    <circle
                      r="2.2"
                      fill="hsl(var(--primary))"
                      opacity="0.25"
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    r="1.3"
                    fill={isFav ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                    stroke="hsl(var(--background))"
                    strokeWidth="0.4"
                  />
                </g>
              );
            })}
          </svg>
        </div>
        {visibleBars.length === 0 && view === 'favorites' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground text-center px-4">
              Nenhum bar marcado ainda.<br />Toque no <Bookmark className="inline w-3.5 h-3.5" /> dos cards.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
          Marcado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted-foreground" />
          Demais
        </span>
      </div>

      {routeUrl && (
        <a
          href={routeUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
        >
          <Maximize2 className="w-4 h-4" />
          {view === 'favorites'
            ? `Abrir ${visibleBars.length} marcados no Google Maps`
            : `Abrir ${visibleBars.length} bares no Google Maps`}
        </a>
      )}
    </section>
  );
}
