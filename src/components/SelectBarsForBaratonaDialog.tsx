import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createBaratonaFromFavoritesApi, type EventBar } from '@/lib/platformApi';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { track } from '@/lib/analytics';
import { Search, Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceEventId: string;
  sourceEventSlug: string;
  bars: EventBar[];
  preselectedIds?: string[];
  defaultName?: string;
}

const MIN_BARS = 3;
const MAX_BARS = 15;
const DRAFT_KEY_PREFIX = 'baratona:select-draft:';

interface Draft {
  name: string;
  selected: string[];
  updatedAt: number;
}

function loadDraft(eventId: string): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + eventId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(eventId: string, draft: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY_PREFIX + eventId, JSON.stringify(draft));
  } catch {
    /* quota / private mode — ignore */
  }
}

function clearDraft(eventId: string) {
  try {
    localStorage.removeItem(DRAFT_KEY_PREFIX + eventId);
  } catch {
    /* ignore */
  }
}

export function SelectBarsForBaratonaDialog({
  open,
  onOpenChange,
  sourceEventId,
  sourceEventSlug,
  bars,
  preselectedIds = [],
  defaultName = 'Minha baratona',
}: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signInWithGoogle } = usePlatformAuth();

  const [name, setName] = useState(defaultName);
  const [selected, setSelected] = useState<Set<string>>(new Set(preselectedIds));
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);

  // On open: hydrate from draft if exists, otherwise use preselected/defaults
  useEffect(() => {
    if (!open) {
      setHydrated(false);
      return;
    }
    const draft = loadDraft(sourceEventId);
    const validIds = new Set(bars.map((b) => b.id).filter(Boolean) as string[]);
    if (draft && (draft.selected.length > 0 || (draft.name && draft.name !== defaultName))) {
      const filteredSel = draft.selected.filter((id) => validIds.has(id));
      setSelected(new Set(filteredSel));
      setName(draft.name || defaultName);
      setResumed(filteredSel.length > 0);
    } else {
      setSelected(new Set(preselectedIds.filter((id) => validIds.has(id))));
      setName(defaultName);
      setResumed(false);
    }
    setSearch('');
    setNeighborhood('all');
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sourceEventId]);

  // Persist draft on every change (after hydration), even with dialog closed if state lingers
  useEffect(() => {
    if (!hydrated) return;
    const hasContent = selected.size > 0 || (name && name !== defaultName);
    if (hasContent) {
      saveDraft(sourceEventId, {
        name,
        selected: Array.from(selected),
        updatedAt: Date.now(),
      });
    } else {
      clearDraft(sourceEventId);
    }
  }, [hydrated, selected, name, sourceEventId, defaultName]);

  function handleResetDraft() {
    clearDraft(sourceEventId);
    setSelected(new Set(preselectedIds));
    setName(defaultName);
    setResumed(false);
  }

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    bars.forEach((b) => b.neighborhood && set.add(b.neighborhood));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [bars]);

  const filteredBars = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bars.filter((b) => {
      if (neighborhood !== 'all' && b.neighborhood !== neighborhood) return false;
      if (!term) return true;
      return (
        b.name.toLowerCase().includes(term) ||
        (b.featuredDish?.toLowerCase().includes(term) ?? false) ||
        (b.neighborhood?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [bars, search, neighborhood]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const count = selected.size;
  const tooFew = count < MIN_BARS;
  const tooMany = count > MAX_BARS;

  async function handleSubmit() {
    if (tooFew || tooMany) return;
    if (!user) {
      toast({
        title: 'Faça login para criar sua baratona',
        description: 'Entre com Google e continuamos.',
        action: <Button size="sm" onClick={() => signInWithGoogle()}>Entrar</Button>,
      });
      return;
    }
    setSubmitting(true);
    try {
      // Preserve selection order roughly by bar_order
      const orderedIds = bars
        .filter((b) => b.id && selected.has(b.id))
        .sort((a, b) => a.barOrder - b.barOrder)
        .map((b) => b.id!) as string[];

      const { slug } = await createBaratonaFromFavoritesApi(
        sourceEventId,
        name.trim() || defaultName,
        orderedIds,
      );
      track('create_baratona_created_from_select', {
        event: sourceEventSlug,
        count: orderedIds.length,
      });
      toast({ title: 'Baratona criada!', description: `${count} bares prontos.` });
      onOpenChange(false);
      navigate(`/baratona/${slug}/admin`);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message || 'Não foi possível criar', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Crie sua baratona
          </DialogTitle>
          <DialogDescription>
            Escolha de {MIN_BARS} a {MAX_BARS} bares para montar sua rota privada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="baratona-name">Nome da baratona</Label>
            <Input
              id="baratona-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Ex: Sextou em Botafogo"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bar, petisco ou bairro..."
              className="pl-8"
            />
          </div>

          {neighborhoods.length > 0 && (
            <div className="-mx-1 px-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-1 w-max pb-1">
                <Button
                  variant={neighborhood === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNeighborhood('all')}
                  className="h-7 text-xs flex-shrink-0"
                >
                  Todos
                </Button>
                {neighborhoods.map((n) => (
                  <Button
                    key={n}
                    variant={neighborhood === n ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNeighborhood(n)}
                    className="h-7 text-xs flex-shrink-0"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className={tooMany ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
              {count} selecionado{count === 1 ? '' : 's'} (mín {MIN_BARS}, máx {MAX_BARS})
            </span>
            {count > 0 && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground underline"
                onClick={() => setSelected(new Set())}
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 rounded-md border border-border p-2 bg-muted/30 min-h-[200px]">
            {filteredBars.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum bar encontrado.</p>
            )}
            {filteredBars.map((bar) => {
              const isSel = bar.id ? selected.has(bar.id) : false;
              return (
                <label
                  key={bar.id}
                  className={`flex items-center gap-2 bg-background rounded px-2 py-2 cursor-pointer transition-colors ${
                    isSel ? 'ring-1 ring-primary' : 'hover:bg-accent/40'
                  }`}
                >
                  <Checkbox
                    checked={isSel}
                    onCheckedChange={() => bar.id && toggle(bar.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{bar.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {bar.neighborhood || '—'}
                      {bar.featuredDish ? ` · ${bar.featuredDish}` : ''}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {tooMany && (
            <p className="text-xs text-destructive">Remova {count - MAX_BARS} para continuar.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || tooFew || tooMany}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar e abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
