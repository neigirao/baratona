import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Settings, ShieldCheck, Archive, ExternalLink, UserPlus, Trash2 } from 'lucide-react';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import {
  adminListAllEventsApi, adminListPlatformRolesApi, adminSetPlatformRoleApi,
  adminRemovePlatformRoleApi, adminUpdateEventOwnerApi,
  archiveEventApi, updateEventApi,
  type PlatformRoleRow,
} from '@/lib/api';
import type { PlatformEvent } from '@/lib/platformEvents';
import { toast } from '@/hooks/use-toast';

type EventRow = PlatformEvent & { barCount: number; memberCount: number };

export default function PlatformAdmin() {
  const { isSuperAdmin, loading } = usePlatformAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [roles, setRoles] = useState<PlatformRoleRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newRoleUserId, setNewRoleUserId] = useState('');

  const refreshEvents = async () => {
    setEventsLoading(true);
    try {
      const data = await adminListAllEventsApi();
      setEvents(data);
    } catch (e) {
      toast({ title: 'Erro ao listar eventos', variant: 'destructive' });
    } finally {
      setEventsLoading(false);
    }
  };

  const refreshRoles = async () => {
    try {
      setRoles(await adminListPlatformRolesApi());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    refreshEvents();
    refreshRoles();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (filterVisibility !== 'all' && e.visibility !== filterVisibility) return false;
      if (filterStatus !== 'all' && (e as any).status !== filterStatus) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q)
      );
    });
  }, [events, search, filterVisibility, filterStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const handleArchive = async (id: string) => {
    try {
      await archiveEventApi(id);
      toast({ title: 'Evento arquivado' });
      refreshEvents();
    } catch {
      toast({ title: 'Erro ao arquivar', variant: 'destructive' });
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateEventApi(id, { status });
      refreshEvents();
    } catch {
      toast({ title: 'Erro ao mudar status', variant: 'destructive' });
    }
  };

  const handleVisibility = async (id: string, visibility: 'public' | 'private') => {
    try {
      await updateEventApi(id, { visibility });
      refreshEvents();
    } catch {
      toast({ title: 'Erro ao mudar visibilidade', variant: 'destructive' });
    }
  };

  const handleTransfer = async (id: string, newOwner: string) => {
    if (!newOwner.trim()) return;
    try {
      await adminUpdateEventOwnerApi(id, newOwner.trim());
      toast({ title: 'Propriedade transferida' });
      refreshEvents();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Erro ao transferir', description: msg, variant: 'destructive' });
    }
  };

  const handleAddRole = async () => {
    if (!newRoleUserId.trim()) return;
    try {
      await adminSetPlatformRoleApi(newRoleUserId.trim(), 'super_admin');
      toast({ title: 'Super-admin adicionado' });
      setNewRoleUserId('');
      refreshRoles();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      await adminRemovePlatformRoleApi(userId, role);
      toast({ title: 'Papel removido' });
      refreshRoles();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Não foi possível remover', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin da plataforma</h1>
            <p className="text-sm text-muted-foreground">
              Gestão global de baratonas, circuitos e papéis.
            </p>
          </div>
        </div>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="roles">Papéis</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4 mt-4">
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

            {eventsLoading ? (
              <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">
                Nenhum evento encontrado.
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map((e) => (
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
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-4 mt-4">
            <Card>
              <CardContent className="py-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Promover novo super-admin
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="user_id (UUID)"
                    value={newRoleUserId}
                    onChange={(e) => setNewRoleUserId(e.target.value)}
                  />
                  <Button onClick={handleAddRole}>Adicionar</Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Use o UUID do usuário (encontre em "Backend → Usuários").
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 space-y-2">
                <h3 className="font-semibold text-sm">Papéis ativos</h3>
                {roles.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum papel cadastrado.</p>
                ) : (
                  roles.map((r) => (
                    <div key={`${r.userId}-${r.role}`} className="flex items-center gap-2 bg-muted/40 rounded p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.displayName || r.userId}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{r.userId}</p>
                      </div>
                      <Badge variant="secondary">{r.role}</Badge>
                      <Button
                        size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => handleRemoveRole(r.userId, r.role)}
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
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
  const status = (event as any).status as string;

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

          <Select value={event.visibility} onValueChange={(v) => onVisibility(event.id, v as any)}>
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
