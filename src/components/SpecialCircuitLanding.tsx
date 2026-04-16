import type { EventBar } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Utensils, Phone, Instagram, ExternalLink } from 'lucide-react';

interface SpecialCircuitLandingProps {
  event: PlatformEvent;
  bars: EventBar[];
}

function googleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function instagramUrl(handle: string) {
  if (handle.startsWith('http')) return handle;
  const clean = handle.replace(/^@/, '');
  return `https://instagram.com/${clean}`;
}

export function SpecialCircuitLanding({ event, bars }: SpecialCircuitLandingProps) {
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          Petiscos em concurso
        </h2>
        <span className="text-sm text-muted-foreground">{bars.length} butecos</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bars.map((bar) => (
          <Card key={bar.id} className="bg-card/60 overflow-hidden flex flex-col">
            {bar.dishImageUrl && (
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={bar.dishImageUrl}
                  alt={bar.featuredDish || bar.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <CardContent className="py-4 space-y-2 flex-1 flex flex-col">
              <div>
                <p className="font-semibold leading-tight">{bar.name}</p>
                {bar.neighborhood && (
                  <p className="text-xs text-muted-foreground">{bar.neighborhood}</p>
                )}
              </div>

              {bar.featuredDish && (
                <div className="bg-primary/10 rounded-md px-2 py-1.5">
                  <p className="text-xs font-semibold text-primary">{bar.featuredDish}</p>
                  {bar.dishDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">
                      {bar.dishDescription}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                {bar.address && (
                  <a
                    href={googleMapsUrl(`${bar.name} ${bar.address}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70"
                  >
                    <MapPin className="w-3 h-3" /> Mapa
                  </a>
                )}
                {bar.phone && (
                  <a
                    href={`tel:${bar.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70"
                  >
                    <Phone className="w-3 h-3" /> Ligar
                  </a>
                )}
                {bar.instagram && (
                  <a
                    href={instagramUrl(bar.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/70"
                  >
                    <Instagram className="w-3 h-3" /> Instagram
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
