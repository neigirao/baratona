import { Bookmark, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type SortMode = 'order' | 'rating' | 'name';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  neighborhood: string;
  onNeighborhood: (v: string) => void;
  neighborhoods: string[];
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  favCount: number;
  sort: SortMode;
  onSort: (s: SortMode) => void;
}

export function CircuitFiltersBar({
  search, onSearch, neighborhood, onNeighborhood, neighborhoods,
  onlyFavorites, onToggleOnlyFavorites, favCount, sort, onSort,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar buteco, petisco ou bairro..."
          className="pl-8"
        />
      </div>

      <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 w-max pb-1">
          <Button
            variant={neighborhood === 'all' && !onlyFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => { onNeighborhood('all'); if (onlyFavorites) onToggleOnlyFavorites(); }}
            className="h-7 text-xs flex-shrink-0"
          >
            Todos
          </Button>
          {favCount > 0 && (
            <Button
              variant={onlyFavorites ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleOnlyFavorites}
              className="h-7 text-xs gap-1 flex-shrink-0"
            >
              <Bookmark className="w-3 h-3" />
              Marcados ({favCount})
            </Button>
          )}
          {neighborhoods.map((n) => (
            <Button
              key={n}
              variant={neighborhood === n ? 'default' : 'outline'}
              size="sm"
              onClick={() => onNeighborhood(n)}
              className="h-7 text-xs flex-shrink-0"
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
            onClick={() => onSort(key)}
            className="h-6 text-xs px-2"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
