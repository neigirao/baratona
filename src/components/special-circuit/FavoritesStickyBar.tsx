import { Bookmark, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  favCount: number;
  onShare: () => void;
  onCreate: () => void;
}

export function FavoritesStickyBar({ favCount, onShare, onCreate }: Props) {
  if (favCount === 0) return null;
  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bookmark className="w-4 h-4 fill-primary text-primary flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {favCount} {favCount === 1 ? 'bar marcado' : 'bares marcados'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onShare}
            aria-label="Compartilhar rota"
            className="h-9 w-9 p-0"
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={onCreate} disabled={favCount < 3}>
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Criar minha baratona
          </Button>
        </div>
      </div>
      {favCount < 3 && (
        <p className="text-xs text-muted-foreground -mt-1">
          Marque pelo menos {3 - favCount} {3 - favCount === 1 ? 'bar' : 'bares'} a mais para criar sua rota.
        </p>
      )}
    </>
  );
}
