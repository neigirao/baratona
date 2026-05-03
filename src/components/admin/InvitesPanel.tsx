import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KeyRound, Copy, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createInviteApi, listInvitesApi, deleteInviteApi } from '@/lib/platformApi';
import { toast } from '@/hooks/use-toast';

interface InvitesPanelProps {
  eventId: string;
  eventSlug: string;
}

export function InvitesPanel({ eventId, eventSlug }: InvitesPanelProps) {
  const qc = useQueryClient();
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const { data: invites = [] } = useQuery({
    queryKey: ['invites', eventId],
    queryFn: () => listInvitesApi(eventId),
  });

  const createMutation = useMutation({
    mutationFn: () => createInviteApi(eventId, { maxUses: 50 }),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['invites', eventId] });
      toast({ title: `Código gerado: ${inv.code}` });
    },
    onError: () => toast({ title: 'Erro ao gerar código', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInviteApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites', eventId] });
      toast({ title: 'Código revogado' });
      setRevokeTargetId(null);
    },
    onError: () => toast({ title: 'Erro ao revogar', variant: 'destructive' }),
  });

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/baratona/${eventSlug}?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!' });
  };

  return (
    <>
      <Card className="border-primary/30">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Convites
            </h3>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              size="sm"
              variant="outline"
            >
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gerar código'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Compartilhe o link para que pessoas entrem no evento privado.
          </p>
          {invites.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum código ainda.</p>
          ) : (
            <div className="space-y-3">
              {invites.map((inv) => {
                const exhausted = inv.maxUses != null && inv.usedCount >= inv.maxUses;
                const inviteUrl = `${window.location.origin}/baratona/${eventSlug}?invite=${inv.code}`;
                const qrSrc = `https://chart.googleapis.com/chart?chs=120x120&cht=qr&chl=${encodeURIComponent(inviteUrl)}&choe=UTF-8`;
                return (
                  <div key={inv.id} className="bg-muted/40 rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-base tracking-wider flex-1">{inv.code}</code>
                      <span className={`text-[10px] ${exhausted ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {inv.usedCount}/{inv.maxUses ?? '∞'} usos
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(inv.code)} title="Copiar link">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setRevokeTargetId(inv.id)} title="Revogar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={qrSrc} alt={`QR code ${inv.code}`} width={60} height={60} className="rounded border bg-white p-0.5" />
                      <p className="text-[10px] text-muted-foreground break-all">{inviteUrl}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeTargetId} onOpenChange={(open) => { if (!open) setRevokeTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar código de convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Este código não poderá mais ser usado para entrar no evento. Pessoas que já entraram não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokeTargetId && deleteMutation.mutate(revokeTargetId)}
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
