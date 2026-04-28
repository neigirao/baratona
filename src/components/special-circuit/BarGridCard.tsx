import { Bookmark, Star, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { EventBar, DishRating } from '@/lib/platformApi';

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
      <div className="aspect-[4/3] bg-muted overflow-hidden relative">
        {bar.dishImageUrl && (
          <img
            src={bar.dishImageUrl}
            alt={bar.featuredDish || bar.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        )}
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
