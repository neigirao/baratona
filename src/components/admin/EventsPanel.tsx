import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Settings, Archive, ExternalLink, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  archiveEventApi, updateEventApi, adminUpdateEventOwnerApi,
} from '@/lib/api';
import type { PlatformEvent } from '@/lib/platformEvents';
import { toast } from '@/hooks/use-toast';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

interface Props {
  events: EventRow[];
  loading: boolean;
  onChanged: () => void;
}

const PAGE_SIZE = 15;

export function EventsPanel({ events, loading, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (filterVisibility !== 'all' && e.visibility !== filterVisibility) return false;
      if (filterStatus !== 'all' && (e as unknown as { status?: string }).status !== filterStatus) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q)
      );
    });
  }, [events, search, filterVisibility, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Reset to page 1 when filters change
  const filterKey = `${search}|${filterVisibility}|${filterStatus}`;
  const [lastKey, setLastKey] = useState(filterKey);
  if (filterKey !== lastKey) {
    setLastKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveEventApi(id);
      toast({ title: 'Evento arquivado' });
      onChanged();
    } catch {
      toast({ title: 'Erro ao arquivar', variant: 'destructive' });
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateEventApi(id, { status });
      onChanged();
    } catch {
      toast({ title: 'Erro ao mudar status', variant: 'destructive' });
    }
  };

  const handleVisibility = async (id: string, visibility: 'public' | 'private') => {
    try {
      await updateEventApi(id, { visibility });
      onChanged();
    } catch {
      toast({ title: 'Erro ao mudar visibilidade', variant: 'destructive' });
    }
  };

  const handleTransfer = async (id: string, newOwner: string) => {
    if (!newOwner.trim()) return;
    try {
      await adminUpdateEventOwnerApi(id, newOwner.trim());
      toast({ title: 'Propriedade transferida' });
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Erro ao transferir', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Input
          placeholder="Buscar por nome, slug ou cidade…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:col-span-2"
        />
        <Select value={filterVisibility} onValueChange={setFilterVisibility}>
          <SelectTrigger><SelectValue placeholder="Visibilidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas visibilidades</SelectItem>
            <SelectItem value="public">Público</SelectItem>
            <SelectItem value="private">Privado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="finished">Finalizado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-8">
          Nenhum evento encontrado.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} resultado(s)</span>
            <span>Página {safePage} de {totalPages}</span>
          </div>
          <div className="space-y-2">
            {visible.map((e) => (
              <EventRowCard
                key={e.id}
                event={e}
                onStatus={handleStatus}
                onVisibility={handleVisibility}
                onArchive={handleArchive}
                onTransfer={handleTransfer}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-2">{safePage} / {totalPages}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface RowProps {
  event: EventRow;
  onStatus: (id: string, status: string) => void;
  onVisibility: (id: string, v: 'public' | 'private') => void;
  onArchive: (id: string) => void;
  onTransfer: (id: string, newOwner: string) => void;
}

function EventRowCard({ event, onStatus, onVisibility, onArchive, onTransfer }: RowProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const status = (event as unknown as { status?: string }).status as string | undefined;

  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{event.name}</p>
              <Badge variant={event.visibility === 'public' ? 'default' : 'secondary'} className="text-[10px]">
                {event.visibility}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{event.eventType}</Badge>
              <Badge variant="outline" className="text-[10px]">{status || '—'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              /{event.slug} · {event.city} · {event.barCount} bares · {event.memberCount} membros
            </p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">owner: {event.ownerId}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/baratona/${event.slug}/admin`}>
              <Settings className="w-3.5 h-3.5 mr-1" /> Editar
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/baratona/${event.slug}`}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver
            </Link>
          </Button>

          <Select value={status || 'draft'} onValueChange={(v) => onStatus(event.id, v)}>
            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="finished">Finalizado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={event.visibility} onValueChange={(v) => onVisibility(event.id, v as 'public' | 'private')}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Público</SelectItem>
              <SelectItem value="private">Privado</SelectItem>
            </SelectContent>
          </Select>

          <AlertDialog open={transferOpen} onOpenChange={setTransferOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost"><UserPlus className="w-3.5 h-3.5 mr-1" /> Transferir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Transferir propriedade</AlertDialogTitle>
                <AlertDialogDescription>
                  Informe o user_id (UUID) do novo dono. Ele passará a poder editar o evento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                placeholder="UUID do novo owner"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { onTransfer(event.id, newOwner); setTransferOpen(false); setNewOwner(''); }}>
                  Transferir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive">
                <Archive className="w-3.5 h-3.5 mr-1" /> Arquivar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Arquivar evento?</AlertDialogTitle>
                <AlertDialogDescription>
                  O evento ficará oculto das listagens, mas dados são preservados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onArchive(event.id)}>Arquivar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
