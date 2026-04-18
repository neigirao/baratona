import { useEffect, useMemo, useState } from 'react';
import type { EventBar, DishRating } from '@/lib/platformApi';
import { getDishRatingsApi } from '@/lib/platformApi';
import type { PlatformEvent } from '@/lib/platformEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Utensils, Phone, Instagram, ExternalLink, Star, Search } from 'lucide-react';

interface SpecialCircuitLandingProps {
  event: PlatformEvent;
  bars: EventBar[];
}

type SortMode = 'order' | 'rating' | 'name';

function googleMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function instagramUrl(handle: string) {
  if (handle.startsWith('http')) return handle;
  const clean = handle.replace(/^@/, '');
  return `https://instagram.com/${clean}`;
}

export function SpecialCircuitLanding({ event, bars }: SpecialCircuitLandingProps) {
  const [ratings, setRatings] = useState<Record<string, DishRating>>({});
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [sort, setSort] = useState<SortMode>('order');

  useEffect(() => {
    getDishRatingsApi(event.id).then(setRatings).catch(() => {});
  }, [event.id]);

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    bars.forEach((b) => b.neighborhood && set.add(b.neighborhood));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [bars]);

  const filteredBars = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = bars.filter((b) => {
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
  }, [bars, search, neighborhood, sort, ratings]);

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
        <span className="text-sm text-muted-foreground">
          {filteredBars.length} de {bars.length}
        </span>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar buteco, petisco ou bairro..."
            className="pl-8"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap flex-1">
            <Button
              variant={neighborhood === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNeighborhood('all')}
              className="h-7 text-xs"
            >
              Todos
            </Button>
            {neighborhoods.map((n) => (
              <Button
                key={n}
                variant={neighborhood === n ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNeighborhood(n)}
                className="h-7 text-xs"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          <span className="text-xs text-muted-foreground self-center mr-1">Ordenar:</span>
          {([
            ['order', 'Ordem'],
            ['rating', 'Melhor avaliado'],
            ['name', 'A-Z'],
          ] as [SortMode, string][]).map(([key, label]) => (
            <Button
              key={key}
              variant={sort === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort(key)}
              className="h-6 text-xs px-2"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredBars.map((bar) => {
          const rating = ratings[bar.id || ''];
          return (
            <Card key={bar.id} className="bg-card/60 overflow-hidden flex flex-col">
              {bar.dishImageUrl && (
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  <img
                    src={bar.dishImageUrl}
                    alt={bar.featuredDish || bar.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                    }}
                  />
                  {rating && (
                    <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 text-xs font-bold">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {rating.averageScore.toFixed(1)}
                      <span className="text-muted-foreground font-normal">({rating.voteCount})</span>
                    </div>
                  )}
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
          );
        })}
      </div>
    </section>
  );
}
