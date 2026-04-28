import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Search } from 'lucide-react';
import {
  adminSetPlatformRoleApi, adminRemovePlatformRoleApi,
  type PlatformRoleRow,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Props {
  roles: PlatformRoleRow[];
  onChanged: () => void;
}

export function RolesPanel({ roles, onChanged }: Props) {
  const [newRoleUserId, setNewRoleUserId] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) =>
      (r.displayName || '').toLowerCase().includes(q) ||
      r.userId.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q)
    );
  }, [roles, search]);

  const handleAddRole = async () => {
    if (!newRoleUserId.trim()) return;
    try {
      await adminSetPlatformRoleApi(newRoleUserId.trim(), 'super_admin');
      toast({ title: 'Super-admin adicionado' });
      setNewRoleUserId('');
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      await adminRemovePlatformRoleApi(userId, role);
      toast({ title: 'Papel removido' });
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast({ title: 'Não foi possível remover', description: msg, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
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
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm">Papéis ativos ({roles.length})</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, UUID ou papel…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {roles.length === 0 ? 'Nenhum papel cadastrado.' : 'Nenhum resultado.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
