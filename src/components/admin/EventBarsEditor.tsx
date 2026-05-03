import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';
import {
  getEventBarsApi, createBarApi, updateBarApi, deleteBarApi, reorderBarsApi,
  type EventBar, type BarInput,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ImageUploader } from './ImageUploader';

interface Props {
  eventId: string;
}

export function EventBarsEditor({ eventId }: Props) {
  const [bars, setBars] = useState<EventBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEventBarsApi(eventId);
      setBars(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  const handleAdd = async () => {
    try {
      const created = await createBarApi(eventId, {
        name: 'Novo bar',
        barOrder: bars.length + 1,
        scheduledTime: '18:00:00',
      });
      setBars((prev) => [...prev, created]);
      setOpenId(created.id!);
      toast({ title: 'Bar adicionado' });
    } catch (e) {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' });
    }
  };

  const handleSave = async (bar: EventBar) => {
    if (!bar.id) return;
    setSaving(bar.id);
    try {
      const patch: BarInput = {
        name: bar.name,
        address: bar.address,
        neighborhood: bar.neighborhood,
        latitude: bar.latitude ?? null,
        longitude: bar.longitude ?? null,
        scheduledTime: bar.scheduledTime,
        featuredDish: bar.featuredDish,
        dishDescription: bar.dishDescription,
        dishImageUrl: bar.dishImageUrl,
        phone: bar.phone,
        instagram: bar.instagram,
      };
      const updated = await updateBarApi(bar.id, patch);
      setBars((prev) => prev.map((b) => (b.id === bar.id ? updated : b)));
      toast({ title: 'Bar atualizado' });
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (barId: string) => {
    try {
      await deleteBarApi(barId);
      setBars((prev) => prev.filter((b) => b.id !== barId));
      toast({ title: 'Bar removido' });
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= bars.length) return;
    const next = [...bars];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setBars(next);
    try {
      await reorderBarsApi(eventId, next.map((b) => b.id!));
      // Refresh local order numbers
      setBars(next.map((b, i) => ({ ...b, barOrder: i + 1 })));
    } catch {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' });
      load();
    }
  };

  const updateLocal = (id: string, patch: Partial<EventBar>) => {
    setBars((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando bares…</p>;

  return (
    <div className="space-y-3">
      <Button onClick={handleAdd} size="sm" variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Adicionar bar
      </Button>

      {bars.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Nenhum bar cadastrado.</p>
      )}

      {bars.map((bar, idx) => {
        const isOpen = openId === bar.id;
        return (
          <Card key={bar.id} className="bg-card/60">
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {bar.barOrder}
                </span>
                <button
                  type="button"
                  className="flex-1 text-left min-w-0"
                  onClick={() => setOpenId(isOpen ? null : bar.id!)}
                >
                  <p className="font-medium text-sm truncate">{bar.name || '(sem nome)'}</p>
                  <p className="text-xs text-muted-foreground truncate">{bar.address}</p>
                </button>
                <div className="flex flex-col">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(idx, 1)} disabled={idx === bars.length - 1}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input value={bar.name} onChange={(e) => updateLocal(bar.id!, { name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Horário</Label>
                      <Input
                        type="time"
                        value={(bar.scheduledTime || '18:00:00').slice(0, 5)}
                        onChange={(e) => updateLocal(bar.id!, { scheduledTime: `${e.target.value}:00` })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Endereço</Label>
                    <Input value={bar.address} onChange={(e) => updateLocal(bar.id!, { address: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Bairro</Label>
                      <Input value={bar.neighborhood ?? ''} onChange={(e) => updateLocal(bar.id!, { neighborhood: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={bar.latitude ?? ''}
                        onChange={(e) => updateLocal(bar.id!, { latitude: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={bar.longitude ?? ''}
                        onChange={(e) => updateLocal(bar.id!, { longitude: e.target.value === '' ? null : Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Telefone</Label>
                      <Input value={bar.phone ?? ''} onChange={(e) => updateLocal(bar.id!, { phone: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Instagram</Label>
                      <Input value={bar.instagram ?? ''} onChange={(e) => updateLocal(bar.id!, { instagram: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Prato em destaque</Label>
                    <Input value={bar.featuredDish ?? ''} onChange={(e) => updateLocal(bar.id!, { featuredDish: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição do prato</Label>
                    <Textarea
                      rows={2}
                      value={bar.dishDescription ?? ''}
                      onChange={(e) => updateLocal(bar.id!, { dishDescription: e.target.value })}
                    />
                  </div>

                  <ImageUploader
                    bucket="bar-dishes"
                    eventId={eventId}
                    value={bar.dishImageUrl}
                    onChange={(url) => updateLocal(bar.id!, { dishImageUrl: url })}
                    label="Foto do prato/bar"
                  />

                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleSave(bar)} disabled={saving === bar.id} size="sm" className="flex-1">
                      {saving === bar.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                      Salvar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover bar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(bar.id!)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
