import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import type { PlatformEvent } from '@/lib/platformEvents';
import { updateEventApi, type EventUpdateInput } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ImageUploader } from './ImageUploader';

interface Props {
  event: PlatformEvent;
  isSuperAdmin?: boolean;
  onSaved?: (e: PlatformEvent) => void;
}

export function EventInfoEditor({ event, isSuperAdmin, onSaved }: Props) {
  const [form, setForm] = useState<EventUpdateInput>({
    name: event.name,
    description: event.description,
    city: event.city,
    visibility: event.visibility as any,
    eventType: event.eventType as any,
    eventDate: event.eventDate,
    startDate: event.startDate,
    endDate: event.endDate,
    coverImageUrl: event.coverImageUrl,
    externalSourceUrl: event.externalSourceUrl,
    ownerName: event.ownerName,
    ...(isSuperAdmin ? { slug: event.slug } : {}),
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EventUpdateInput>(k: K, v: EventUpdateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateEventApi(event.id, form);
      toast({ title: 'Informações salvas' });
      onSaved?.(updated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar';
      toast({ title: 'Não foi possível salvar', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="space-y-1">
          <Label>Nome do evento</Label>
          <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Descrição</Label>
          <Textarea
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Cidade</Label>
            <Input value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Organizador</Label>
            <Input
              value={form.ownerName ?? ''}
              onChange={(e) => set('ownerName', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Data</Label>
            <Input
              type="date"
              value={form.eventDate ?? ''}
              onChange={(e) => set('eventDate', e.target.value || null)}
            />
          </div>
          <div className="space-y-1">
            <Label>Início</Label>
            <Input
              type="date"
              value={form.startDate ?? ''}
              onChange={(e) => set('startDate', e.target.value || null)}
            />
          </div>
          <div className="space-y-1">
            <Label>Fim</Label>
            <Input
              type="date"
              value={form.endDate ?? ''}
              onChange={(e) => set('endDate', e.target.value || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Visibilidade</Label>
            <Select
              value={form.visibility}
              onValueChange={(v) => set('visibility', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select
              value={form.eventType}
              onValueChange={(v) => set('eventType', v as any)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open_baratona">Baratona aberta</SelectItem>
                <SelectItem value="special_circuit">Circuito especial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>URL externa (site oficial)</Label>
          <Input
            value={form.externalSourceUrl ?? ''}
            onChange={(e) => set('externalSourceUrl', e.target.value || null)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1">
          <Label>Capa do evento</Label>
          <ImageUploader
            bucket="event-covers"
            eventId={event.id}
            value={form.coverImageUrl}
            onChange={(url) => set('coverImageUrl', url)}
          />
        </div>

        {isSuperAdmin && (
          <div className="space-y-1 border-t pt-3">
            <Label className="text-amber-600">Slug (super-admin)</Label>
            <Input
              value={form.slug ?? ''}
              onChange={(e) => set('slug', e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Mudar o slug muda a URL do evento. Use com cuidado.
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar informações
        </Button>
      </CardContent>
    </Card>
  );
}
