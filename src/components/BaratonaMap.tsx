import { useMemo } from "react";
import { useBaratona } from "@/contexts/BaratonaContext";
import { MapPin, Bus } from "lucide-react";

function getGoogleMapsSearchUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function getOpenStreetMapEmbedUrl(lat: number, lng: number) {
  // bbox around the point (roughly a few city blocks)
  const delta = 0.012;
  const left = lng - delta;
  const bottom = lat - delta;
  const right = lng + delta;
  const top = lat + delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function BaratonaMap() {
  const { bars, barsLoading, appConfig, t } = useBaratona();

  const currentBar = useMemo(() => {
    if (!appConfig?.current_bar_id) return undefined;
    return bars.find((b) => b.id === appConfig.current_bar_id);
  }, [appConfig?.current_bar_id, bars]);

  const center = useMemo((): { lat: number; lng: number } | null => {
    if (!appConfig || bars.length === 0) return null;

    if (
      appConfig.status === "in_transit" &&
      appConfig.origin_bar_id &&
      appConfig.destination_bar_id
    ) {
      const origin = bars.find((b) => b.id === appConfig.origin_bar_id);
      const dest = bars.find((b) => b.id === appConfig.destination_bar_id);

      if (
        origin?.latitude != null &&
        origin?.longitude != null &&
        dest?.latitude != null &&
        dest?.longitude != null
      ) {
        return {
          lat: (origin.latitude + dest.latitude) / 2,
          lng: (origin.longitude + dest.longitude) / 2,
        };
      }
    }

    if (currentBar?.latitude != null && currentBar?.longitude != null) {
      return { lat: currentBar.latitude, lng: currentBar.longitude };
    }

    const firstBar = bars[0];
    if (firstBar?.latitude != null && firstBar?.longitude != null) {
      return { lat: firstBar.latitude, lng: firstBar.longitude };
    }

    return null;
  }, [appConfig, bars, currentBar]);

  if (barsLoading) {
    return (
      <div className="bar-card h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const embedUrl = center ? getOpenStreetMapEmbedUrl(center.lat, center.lng) : null;

  return (
    <section className="bar-card overflow-hidden" aria-label={t.map}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">{t.map}</h2>
        {appConfig?.status === "in_transit" && (
          <span className="status-badge status-in-transit ml-auto flex items-center gap-1">
            <Bus className="w-3 h-3" />
            {t.inTransit}
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

      <div className="mt-3 space-y-2">
        {currentBar && (
          <a
            href={getGoogleMapsSearchUrl(`${currentBar.name} ${currentBar.address}`)}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-medium text-primary underline underline-offset-4"
          >
            Abrir bar atual no Google Maps
          </a>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Ver todos os bares
          </summary>
          <div className="mt-2 space-y-2">
            {bars.map((bar) => (
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
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Abrir
                </span>
              </a>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
