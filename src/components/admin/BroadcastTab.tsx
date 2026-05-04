import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type EventConfigPatch = {
  broadcast_msg?: string | null;
};

interface BroadcastTabProps {
  broadcastMsg: string | null | undefined;
  onUpdateConfig: (patch: EventConfigPatch) => Promise<boolean>;
}

export function BroadcastTab({ broadcastMsg, onUpdateConfig }: BroadcastTabProps) {
  const [draft, setDraft] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSend = async () => {
    if (!draft.trim()) return;
    await onUpdateConfig({ broadcast_msg: draft });
    toast({ title: 'Mensagem enviada!' });
    setDraft('');
  };

  const handleClear = async () => {
    await onUpdateConfig({ broadcast_msg: null });
    toast({ title: 'Mensagem removida' });
    setConfirmClear(false);
  };

  return (
    <>
      <Card>
        <CardContent className="py-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Mensagem de Broadcast
          </h3>
          {broadcastMsg && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm">📢 {broadcastMsg}</p>
              <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setConfirmClear(true)}>
                Remover mensagem
              </Button>
            </div>
          )}
          <Textarea
            placeholder="Ex: A van vai sair em 5 minutos!"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
          <Button onClick={handleSend} className="w-full">Enviar Broadcast</Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover mensagem de broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              A mensagem deixará de aparecer para todos os participantes imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClear}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
