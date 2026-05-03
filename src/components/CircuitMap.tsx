import { useMemo } from 'react';
import type { EventBar } from '@/lib/platformApi';
import { MapPin, Maximize2 } from 'lucide-react';

interface CircuitMapProps {
  bars: EventBar[];
  favorites: Set<string>;
  onToggleFavorite?: (barId: string) => void;
  /** @deprecated kept for backwards compat — map is always auto */
  hideViewToggle?: boolean;
  totalCount?: number;
}

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

export function CircuitMap({ bars, favorites }: CircuitMapProps) {
  const barsWithCoords = useMemo(
    () => bars.filter((b) => b.id && b.latitude != null && b.longitude != null),
    [bars]
  );

  const hasFavorites = favorites.size > 0;

  // Always show all bars on the map; favorites get highlighted pins
  const visibleBars = barsWithCoords;

  // Route only through favorites (if any), otherwise all bars
  const routeBars = useMemo(() => {
    if (hasFavorites) return barsWithCoords.filter((b) => favorites.has(b.id || ''));
    return barsWithCoords;
  }, [hasFavorites, barsWithCoords, favorites]);

  const bbox = useMemo(() => {
    const source = barsWithCoords;
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
  const routeUrl = routeBars.length >= 2 ? buildMultiStopUrl(routeBars) : null;

  return (
    <section className="bar-card overflow-hidden" aria-label="Mapa do circuito">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Mapa do circuito</h2>
        <span className="text-xs text-muted-foreground ml-auto">
          {`${visibleBars.length} ${visibleBars.length === 1 ? 'bar' : 'bares'} no mapa`}
        </span>
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
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        {hasFavorites && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
            Marcado
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted-foreground" />
          {hasFavorites ? 'Demais' : 'Bares'}
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
          {hasFavorites
            ? `Abrir ${routeBars.length} marcados no Google Maps`
            : `Abrir ${visibleBars.length} bares no Google Maps`}
        </a>
      )}
    </section>
  );
}
