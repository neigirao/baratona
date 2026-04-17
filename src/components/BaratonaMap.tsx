import { useMemo } from "react";
import { useBaratona } from "@/contexts/BaratonaContext";
import { MapPin, Bus, Route } from "lucide-react";

function getGoogleMapsSearchUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function getOpenStreetMapEmbedUrl(lat: number, lng: number) {
  const delta = 0.012;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function getOpenStreetMapBboxUrl(bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  // padding ~10%
  const padLat = Math.max((bbox.maxLat - bbox.minLat) * 0.1, 0.005);
  const padLng = Math.max((bbox.maxLng - bbox.minLng) * 0.1, 0.005);
  const left = bbox.minLng - padLng;
  const right = bbox.maxLng + padLng;
  const bottom = bbox.minLat - padLat;
  const top = bbox.maxLat + padLat;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik`;
}

function buildDynamicRouteUrl(bars: Array<{ name: string; address: string }>) {
  const stops = bars
    .filter((b) => b.name && b.address)
    .map((b) => encodeURIComponent(`${b.name}, ${b.address}`))
    .join("/");
  return `https://www.google.com/maps/dir/${stops}`;
}

export function BaratonaMap() {
  const { bars, barsLoading, appConfig, t, eventType } = useBaratona();

  // Detect circuit mode: explicit eventType OR inferred (no current_bar_id and multiple bars with coords)
  const barsWithCoords = useMemo(
    () => bars.filter((b) => b.latitude != null && b.longitude != null),
    [bars]
  );
  const isCircuit =
    eventType === 'special_circuit' ||
    (eventType !== 'open_baratona' && !appConfig?.current_bar_id && barsWithCoords.length >= 2 && bars.every((b: any) => !b.scheduled_time || b.featured_dish));

  const currentBar = useMemo(() => {
    if (!appConfig?.current_bar_id) return undefined;
    return bars.find((b) => b.id === appConfig.current_bar_id);
  }, [appConfig?.current_bar_id, bars]);

  // Bounding box for circuit mode
  const bbox = useMemo(() => {
    if (barsWithCoords.length === 0) return null;
    const lats = barsWithCoords.map((b) => b.latitude as number);
    const lngs = barsWithCoords.map((b) => b.longitude as number);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [barsWithCoords]);

  // Center for route mode
  const center = useMemo((): { lat: number; lng: number } | null => {
    if (!appConfig || bars.length === 0) return null;
    if (
      appConfig.status === "in_transit" &&
      appConfig.origin_bar_id &&
      appConfig.destination_bar_id
    ) {
      const origin = bars.find((b) => b.id === appConfig.origin_bar_id);
      const dest = bars.find((b) => b.id === appConfig.destination_bar_id);
      if (origin?.latitude != null && origin?.longitude != null && dest?.latitude != null && dest?.longitude != null) {
        return { lat: (origin.latitude + dest.latitude) / 2, lng: (origin.longitude + dest.longitude) / 2 };
      }
    }
    if (currentBar?.latitude != null && currentBar?.longitude != null) {
      return { lat: currentBar.latitude, lng: currentBar.longitude };
    }
    const firstBar = barsWithCoords[0];
    if (firstBar?.latitude != null && firstBar?.longitude != null) {
      return { lat: firstBar.latitude, lng: firstBar.longitude };
    }
    return null;
  }, [appConfig, bars, currentBar, barsWithCoords]);

  if (barsLoading) {
    return (
      <div className="bar-card h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const embedUrl = isCircuit && bbox
    ? getOpenStreetMapBboxUrl(bbox)
    : center
    ? getOpenStreetMapEmbedUrl(center.lat, center.lng)
    : null;

  const routeUrl = bars.length > 0 ? buildDynamicRouteUrl(bars as any) : null;

  return (
    <section className="bar-card overflow-hidden" aria-label={t.map}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">{t.map}</h2>
        {!isCircuit && appConfig?.status === "in_transit" && (
          <span className="status-badge status-in-transit ml-auto flex items-center gap-1">
            <Bus className="w-3 h-3" />
            {t.inTransit}
          </span>
        )}
        {isCircuit && (
          <span className="ml-auto text-xs text-muted-foreground">
            {barsWithCoords.length} de {bars.length} no mapa
          </span>
        )}
      </div>

      {embedUrl ? (
        <div className="rounded-lg overflow-hidden h-64 relative border border-border">
          <iframe
            title={t.map}
            src={embedUrl}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          Mapa indisponível (sem coordenadas).
        </div>
      )}

      <div className="mt-3 space-y-3">
        {routeUrl && bars.length >= 2 && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Route className="w-5 h-5" />
            {isCircuit ? `Abrir ${bars.length} bares no Google Maps` : `Ver Rota Completa (${bars.length} bares)`}
          </a>
        )}

        {!isCircuit && currentBar && (
          <a
            href={getGoogleMapsSearchUrl(`${currentBar.name} ${currentBar.address}`)}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-medium text-primary underline underline-offset-4 text-center"
          >
            Abrir bar atual no Google Maps
          </a>
        )}

        {isCircuit ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Todos os bares:</p>
            {bars.map((bar: any) => (
              <a
                key={bar.id}
                href={getGoogleMapsSearchUrl(`${bar.name} ${bar.address}`)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{bar.name}</p>
                  {bar.neighborhood && (
                    <p className="truncate text-xs text-muted-foreground">{bar.neighborhood}</p>
                  )}
                </div>
                <span className="text-xs text-primary whitespace-nowrap">Abrir</span>
              </a>
            ))}
          </div>
        ) : (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Ver todos os bares</summary>
            <div className="mt-2 space-y-2">
              {bars.map((bar: any) => (
                <a
                  key={bar.id}
                  href={getGoogleMapsSearchUrl(`${bar.name} ${bar.address}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 hover:bg-muted/40"
                >
                  <span className="truncate">
                    {bar.bar_order}. {bar.name}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Abrir</span>
                </a>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
