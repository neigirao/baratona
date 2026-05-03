import { Bookmark, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

export type SortMode = 'order' | 'rating' | 'name' | 'neighborhood';
export type LayoutMode = 'grid' | 'list';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  neighborhood: string;
  onNeighborhood: (v: string) => void;
  neighborhoods: string[];
  zoneCounts?: Record<string, number>;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  favCount: number;
  sort: SortMode;
  onSort: (s: SortMode) => void;
  layout?: LayoutMode;
  onLayout?: (l: LayoutMode) => void;
}

export function CircuitFiltersBar({
  search, onSearch,
  neighborhood, onNeighborhood, neighborhoods, zoneCounts,
  onlyFavorites, onToggleOnlyFavorites, favCount,
  sort, onSort, layout, onLayout,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Search + sort + layout */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar bar, bairro ou petisco…"
            className="pl-9 bg-card border-border"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortMode)}
          className="bg-card border border-border rounded-lg px-3.5 py-2 text-[13px] text-foreground cursor-pointer outline-none hover:border-primary/40"
        >
          <option value="order">Ordem padrão</option>
          <option value="rating">Melhor avaliado</option>
          <option value="name">A → Z</option>
          <option value="neighborhood">Por bairro</option>
        </select>

        {onLayout && (
          <div className="flex bg-card border border-border rounded-lg overflow-hidden">
            {(['grid', 'list'] as const).map((v, i) => (
              <button
                key={v}
                onClick={() => onLayout(v)}
                className={`px-3.5 py-2 flex items-center gap-1.5 text-[13px] transition-colors ${
                  layout === v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                } ${i === 0 ? 'border-r border-border' : ''}`}
                aria-label={v === 'grid' ? 'Visualização em grade' : 'Visualização em lista'}
              >
                {v === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone pills */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 w-max pb-1">
          <ZonePill active={neighborhood === 'all' && !onlyFavorites} onClick={() => { onNeighborhood('all'); if (onlyFavorites) onToggleOnlyFavorites(); }}>
            Todos
          </ZonePill>
          {favCount > 0 && (
            <ZonePill active={onlyFavorites} onClick={onToggleOnlyFavorites}>
              <Bookmark className="w-3 h-3 mr-1 inline" />
              Marcados ({favCount})
            </ZonePill>
          )}
          {neighborhoods.map((n) => (
            <ZonePill key={n} active={neighborhood === n} onClick={() => onNeighborhood(n)}>
              {n}
              {zoneCounts && zoneCounts[n] != null && (
                <span className="opacity-60 text-[11px] ml-1">({zoneCounts[n]})</span>
              )}
            </ZonePill>
          ))}
        </div>
      </div>
    </div>
  );
}

function ZonePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[13px] transition-all flex-shrink-0 border ${
        active
          ? 'bg-primary text-primary-foreground border-transparent font-bold'
          : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-border-2'
      }`}
    >
      {children}
    </button>
  );
}
