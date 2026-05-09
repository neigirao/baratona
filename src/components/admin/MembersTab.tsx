import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserX, Search, Download } from 'lucide-react';
import { removeEventMemberApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type EventMember = Database['public']['Tables']['event_members']['Row'];

interface Props {
  eventId: string;
  members: EventMember[];
  onChanged: () => void;
}

export function MembersTab({ eventId, members, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = search.trim()
    ? members.filter((m) =>
        (m.display_name ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : members;

  const handleRemove = async () => {
    if (!confirmId) return;
    setRemoving(confirmId);
    setConfirmId(null);
    try {
      await removeEventMemberApi(eventId, confirmId);
      toast({ title: 'Participante removido' });
      onChanged();
    } catch {
      toast({ title: 'Erro ao remover participante', variant: 'destructive' });
    } finally {
      setRemoving(null);
    }
  };

  const handleExport = () => {
    const rows = [
      ['Nome', 'Papel', 'Entrou em'],
      ...members.map((m) => [
        m.display_name ?? '',
        m.role,
        m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participantes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmMember = members.find((m) => m.user_id === confirmId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar participante…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} title="Exportar CSV">
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{members.length} participante(s)</p>

      <Card>
        <CardContent className="py-0 divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              {members.length === 0 ? 'Nenhum participante ainda.' : 'Nenhum resultado.'}
            </p>
          ) : (
            filtered.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.display_name ?? 'Sem nome'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{m.user_id}</p>
                </div>
                <Badge
                  variant={m.role === 'event_owner' ? 'default' : 'secondary'}
                  className="text-[10px] shrink-0"
                >
                  {m.role}
                </Badge>
                {m.role !== 'event_owner' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive shrink-0"
                    disabled={removing === m.user_id}
                    onClick={() => setConfirmId(m.user_id)}
                    title="Remover participante"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover participante?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmMember?.display_name ?? 'Este participante'}</strong> perderá acesso ao evento.
              Dados de consumo e votos já registrados serão preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
