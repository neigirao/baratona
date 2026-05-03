import { Bookmark, Star, MapPin } from 'lucide-react';
import type { EventBar, DishRating } from '@/lib/platformApi';

const ZONA_GRADIENTS: Record<string, [string, string]> = {
  'Zona Sul':        ['#1a0e2a', '#3a1a50'],
  'Centro':          ['#1a1000', '#3a2800'],
  'Zona Norte':      ['#001a14', '#003028'],
  'Niterói/Baixada': ['#001428', '#002848'],
};

interface Props {
  bar: EventBar;
  rank: number;
  zone: string;
  rating?: DishRating;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

export function BarListRow({ bar, rank, zone, rating, isFavorite, onToggleFavorite, onOpenDetail }: Props) {
  const [c1, c2] = ZONA_GRADIENTS[zone] ?? ['#1a1a1a', '#2a2a2a'];
  const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : null;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-card/60 transition-colors cursor-pointer"
      onClick={() => bar.id && onOpenDetail(bar.id)}
      role="button"
    >
      <span
        className={`font-heading font-bold text-sm min-w-6 text-right ${
          rank <= 3 ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {medal ?? rank}
      </span>
      <div
        className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        🍺
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
          {bar.name}
          {isFavorite && (
            <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
              ★ marcado
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {bar.neighborhood ?? '—'} · {zone}
        </p>
      </div>
      {rating && (
        <span
          className={`text-sm font-extrabold whitespace-nowrap ${
            rating.averageScore >= 9 ? 'text-amber-300' : 'text-primary'
          }`}
        >
          ★ {rating.averageScore.toFixed(1)}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (bar.id) onToggleFavorite(bar.id);
        }}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold border transition-colors whitespace-nowrap ${
          isFavorite
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
        }`}
      >
        <Bookmark className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
        {isFavorite ? 'Marcado' : 'Marcar'}
      </button>
    </div>
  );
}
