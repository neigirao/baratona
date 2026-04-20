import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createBaratonaFromFavoritesApi, type EventBar } from '@/lib/platformApi';
import { GripVertical, X, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceEventId: string;
  selectedBars: EventBar[];
  onRemove: (barId: string) => void;
  onReorder: (barIds: string[]) => void;
  defaultName?: string;
}

export function CreateBaratonaFromFavoritesDialog({
  open,
  onOpenChange,
  sourceEventId,
  selectedBars,
  onRemove,
  onReorder,
  defaultName = 'Minha rota Comida di Buteco',
}: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const count = selectedBars.length;
  const tooFew = count < 3;
  const tooMany = count > 15;

  function move(from: number, to: number) {
    if (from === to) return;
    const ids = selectedBars.map((b) => b.id!).filter(Boolean);
    const [item] = ids.splice(from, 1);
    ids.splice(to, 0, item);
    onReorder(ids);
  }

  async function handleSubmit() {
    if (tooFew || tooMany) return;
    setSubmitting(true);
    try {
      const { slug } = await createBaratonaFromFavoritesApi(
        sourceEventId,
        name.trim() || defaultName,
        selectedBars.map((b) => b.id!).filter(Boolean)
      );
      toast({ title: 'Baratona criada!', description: `${count} bares prontos pra rolar.` });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar minha baratona</DialogTitle>
          <DialogDescription>
            Sua rota privada com os {count} {count === 1 ? 'bar marcado' : 'bares marcados'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label>Ordem dos bares (arraste pra reordenar)</Label>
            <div className="max-h-72 overflow-y-auto space-y-1 rounded-md border border-border p-2 bg-muted/30">
              {selectedBars.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum bar marcado.
                </p>
              )}
              {selectedBars.map((bar, idx) => (
                <div
                  key={bar.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx !== null) move(dragIdx, idx);
                    setDragIdx(null);
                  }}
                  className="flex items-center gap-2 bg-background rounded px-2 py-1.5 cursor-move group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{bar.name}</p>
                    {bar.neighborhood && (
                      <p className="text-xs text-muted-foreground truncate">{bar.neighborhood}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(bar.id!)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    aria-label="Remover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {tooFew && (
              <p className="text-xs text-destructive">Selecione no mínimo 3 bares.</p>
            )}
            {tooMany && (
              <p className="text-xs text-destructive">Máximo 15 bares — remova {count - 15}.</p>
            )}
          </div>
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
