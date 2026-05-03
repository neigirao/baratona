import { useEffect, useRef, useState } from 'react';
import { Bookmark, Star, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { EventBar, DishRating } from '@/lib/platformApi';

// Zone-based gradient placeholders
const ZONA_GRADIENTS: Record<string, [string, string]> = {
  'Zona Sul':        ['#1a0e2a', '#3a1a50'],
  'Centro':          ['#1a1000', '#3a2800'],
  'Zona Norte':      ['#001a14', '#003028'],
  'Niterói/Baixada': ['#001428', '#002848'],
};
const DEFAULT_GRADIENT: [string, string] = ['#0d0d0d', '#1a1a1a'];

function getZoneKey(neighborhood?: string | null): string {
  if (!neighborhood) return '';
  for (const zone of Object.keys(ZONA_GRADIENTS)) {
    if (neighborhood.toLowerCase().includes(zone.toLowerCase().split('/')[0].toLowerCase())) {
      return zone;
    }
  }
  if (neighborhood.toLowerCase().includes('niter') || neighborhood.toLowerCase().includes('baixada')) {
    return 'Niterói/Baixada';
  }
  return '';
}

interface LazyBarImageProps {
  src?: string | null;
  alt: string;
  neighborhood?: string | null;
}

function LazyBarImage({ src, alt, neighborhood }: LazyBarImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [visible, setVisible] = useState(false);

  const zoneKey = getZoneKey(neighborhood);
  const [c1, c2] = ZONA_GRADIENTS[zoneKey] ?? DEFAULT_GRADIENT;

  useEffect(() => {
    if (!src) { setStatus('error'); return; }
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [src]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Placeholder */}
      {status !== 'loaded' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {status === 'loading' && src && (
            <div className="absolute inset-0 animate-shimmer" />
          )}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
            <path d="M4.5 11h15M4.5 11a2.5 2.5 0 0 1 0-5h15a2.5 2.5 0 0 1 0 5M4.5 11v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M19.5 6H18V3h-4v3H4.5" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Actual image (only when visible in viewport) */}
      {visible && src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          style={{
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}

interface Props {
  bar: EventBar;
  rating?: DishRating;
  isFavorite: boolean;
  favoriteCount: number;
  onToggleFavorite: (barId: string) => void;
  onOpenDetail: (barId: string) => void;
}

export function BarGridCard({ bar, rating, isFavorite, favoriteCount, onToggleFavorite, onOpenDetail }: Props) {
  return (
    <Card
      className={`bg-card/60 overflow-hidden flex flex-col transition-all cursor-pointer hover:ring-1 hover:ring-border ${
        isFavorite ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
      }`}
      onClick={() => bar.id && onOpenDetail(bar.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && bar.id) {
          e.preventDefault();
          onOpenDetail(bar.id);
        }
      }}
      aria-label={`Ver detalhes de ${bar.name}`}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <LazyBarImage
          src={bar.dishImageUrl}
          alt={bar.featuredDish || bar.name}
          neighborhood={bar.neighborhood}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (bar.id) onToggleFavorite(bar.id);
          }}
          className={`absolute top-2 left-2 w-9 h-9 rounded-full backdrop-blur flex items-center justify-center transition-all ${
            isFavorite
              ? 'bg-primary text-primary-foreground scale-110'
              : 'bg-background/80 text-foreground hover:bg-background'
          }`}
          aria-label={isFavorite ? 'Remover dos marcados' : 'Marcar bar'}
          aria-pressed={isFavorite}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        {rating && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 text-xs font-bold">
            <Star className="w-3 h-3 fill-primary text-primary" />
            {rating.averageScore.toFixed(1)}
            <span className="text-muted-foreground font-normal">({rating.voteCount})</span>
          </div>
        )}
      </div>
      <CardContent className="py-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{bar.name}</p>
            {bar.neighborhood && (
              <p className="text-xs text-muted-foreground">{bar.neighborhood}</p>
            )}
          </div>
          {favoriteCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary flex-shrink-0"
              title={`${favoriteCount} pessoa(s) marcaram este buteco`}
            >
              <Users className="w-3 h-3" />
              {favoriteCount}
            </span>
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

        <p className="text-xs text-primary mt-auto pt-1 font-medium">
          Ver detalhes →
        </p>
      </CardContent>
    </Card>
  );
}
