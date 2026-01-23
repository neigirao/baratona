import { useMemo } from "react";
import { useBaratona } from "@/contexts/BaratonaContext";
import { MapPin, Bus, Route } from "lucide-react";

function getGoogleMapsSearchUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// Fixed route URL with all 9 bars
const FULL_ROUTE_URL = "https://www.google.com/maps/dir/Pav%C3%A3o+Azul+Bar,+Rua+Hil%C3%A1rio+de+Gouveia,+71+-+Copacabana,+Rio+de+Janeiro+-+RJ,+Brazil/Chanchada+Bar,+Rua+General+Polidoro,+164+b+-+Botafogo,+Rio+de+Janeiro+-+RJ,+Brasil/RioTap+Beer+House,+Travessa+dos+Tamoios,+32+-+LOJA+B+e+C+-+Flamengo,+Rio+de+Janeiro+-+RJ,+Brazil/SURU+%E2%80%A2+bar,+Rua+da+Lapa,+151+-+Lapa,+Rio+de+Janeiro+-+RJ,+Brazil/Bar+da+Frente,+Rua+Bar%C3%A3o+de+Iguatemi,+388+-+Pra%C3%A7a+da+Bandeira,+Rio+de+Janeiro+-+RJ,+Brasil/Bar+Noo+Cacha%C3%A7aria,+Rua+Bar%C3%A3o+de+Iguatemi,+358+-+Pra%C3%A7a+da+Bandeira,+Rio+de+Janeiro+-+RJ,+Brasil/Miudinho,+Rua+Visconde+de+Itamarati,+115+-+Maracan%C3%A3,+Rio+de+Janeiro+-+RJ,+Brasil/Bar%C3%B3dromo+%E2%80%93+Bar+do+Carnaval+e+da+Roda+de+Samba+Enredo+Maracan%C3%A3+%7C+RJ,+Rua+Dona+Zulmira,+41+-+Maracan%C3%A3,+Rio+de+Janeiro+-+RJ,+Brasil/Fregola+Pub,+Rua+Geminiano+G%C3%B3is,+70+-+Freguesia+(Jacarepagu%C3%A1),+Rio+de+Janeiro+-+RJ,+Brasil/data=!4m56!4m55!1m5!1m1!19sChIJfzUpdlrVmwARBa4qxLE4r7k!2m2!1d-43.1846008!2d-22.9676586!1m5!1m1!19sChIJVe6oOPF_mQARejg-i5wgTaE!2m2!1d-43.1856437!2d-22.9560446!1m5!1m1!19sChIJgY7ZZPR_mQARw9cqyKaSXiI!2m2!1d-43.1769384!2d-22.9347311!1m5!1m1!19sChIJje1IWBl_mQARedEn4j27YxA!2m2!1d-43.177538899999995!2d-22.9159273!1m5!1m1!19sChIJcQRwcVV-mQARltslpG9a4dg!2m2!1d-43.215244299999995!2d-22.913421099999997!1m5!1m1!19sChIJ8TLbZVV-mQARu2NqFrJlxm8!2m2!1d-43.215010299999996!2d-22.913286199999998!1m5!1m1!19sChIJMRfRVVh_mQARsU6TmwtgcTY!2m2!1d-43.232317099999996!2d-22.917933299999998!1m5!1m1!19sChIJLXa08g5_mQAR4rQ9cleH0DI!2m2!1d-43.234827599999996!2d-22.9159127!1m5!1m1!19sChIJGfGfuA3ZmwARYtDyxQ0h8T8!2m2!1d-43.3347675!2d-22.9388732!3e0";

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

      <div className="mt-3 space-y-3">
        {/* Full Route Button */}
        <a
          href={FULL_ROUTE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg"
        >
          <Route className="w-5 h-5" />
          Ver Rota Completa (9 bares)
        </a>

        {currentBar && (
          <a
            href={getGoogleMapsSearchUrl(`${currentBar.name} ${currentBar.address}`)}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-medium text-primary underline underline-offset-4 text-center"
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
