import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, ShieldCheck, ShieldOff, Copy, Users } from 'lucide-react';
import {
  adminListUsersApi, adminSetPlatformRoleApi, adminRemovePlatformRoleApi,
  type PlatformUserRow,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function initials(name: string | null, email: string | null) {
  const src = (name || email || '?').trim();
  return src.split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
}

export function UsersPanel() {
  const [users, setUsers] = useState<PlatformUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await adminListUsersApi(debounced || undefined, 200, 0);
      setUsers(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Erro ao listar usuários', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [debounced]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.roles.includes('super_admin')).length,
    creators: users.filter(u => u.eventsOwned > 0).length,
  }), [users]);

  const handlePromote = async (u: PlatformUserRow) => {
    setBusyId(u.userId);
    try {
      await adminSetPlatformRoleApi(u.userId, 'super_admin');
      toast({ title: 'Promovido a super-admin', description: u.email ?? u.userId });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Falha ao promover', description: msg, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (u: PlatformUserRow) => {
    setBusyId(u.userId);
    try {
      await adminRemovePlatformRoleApi(u.userId, 'super_admin');
      toast({ title: 'Permissão revogada', description: u.email ?? u.userId });
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Falha ao revogar', description: msg, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado' });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Usuários</p>
            <p className="text-xl font-bold text-primary">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Super-admins</p>
            <p className="text-xl font-bold text-primary">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Criadores</p>
            <p className="text-xl font-bold text-primary">{stats.creators}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou UUID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Users className="w-6 h-6 opacity-50" />
            Nenhum usuário encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isAdmin = u.roles.includes('super_admin');
            const busy = busyId === u.userId;
            return (
              <Card key={u.userId}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={u.avatarUrl ?? undefined} alt={u.displayName ?? u.email ?? ''} />
                      <AvatarFallback className="bg-muted text-xs font-bold">
                        {initials(u.displayName, u.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">
                          {u.displayName ?? <span className="text-muted-foreground italic">Sem nome</span>}
                        </p>
                        {isAdmin && (
                          <Badge variant="default" className="gap-1 text-[10px]">
                            <ShieldCheck className="w-3 h-3" /> super-admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        {u.email ?? '—'}
                        {u.email && (
                          <button
                            onClick={() => copy(u.email!)}
                            className="opacity-50 hover:opacity-100"
                            title="Copiar e-mail"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span>Criado: {formatDate(u.createdAt)}</span>
                        <span>Último login: {formatDate(u.lastSignInAt)}</span>
                        <span>Eventos: {u.eventsOwned} criados / {u.eventsJoined} participando</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {u.userId}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      {isAdmin ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm" variant="outline"
                              disabled={busy}
                              className="h-8 gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                              Revogar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revogar super-admin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {u.displayName ?? u.email ?? u.userId} perderá acesso ao painel da plataforma.
                                Esta ação é reversível.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRevoke(u)}>
                                Revogar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm" variant="gold"
                              disabled={busy}
                              className="h-8 gap-1"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                              Promover
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Promover a super-admin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {u.displayName ?? u.email ?? u.userId} terá acesso total ao painel da
                                plataforma, incluindo edição de qualquer evento e gestão de papéis.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePromote(u)}>
                                Promover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
