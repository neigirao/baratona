import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type EventConfigPatch = {
  broadcast_msg?: string | null;
};

interface BroadcastTabProps {
  broadcastMsg: string | null | undefined;
  onUpdateConfig: (patch: EventConfigPatch) => Promise<boolean>;
}

export function BroadcastTab({ broadcastMsg, onUpdateConfig }: BroadcastTabProps) {
  const [draft, setDraft] = useState('');

  const handleSend = async () => {
    if (!draft.trim()) return;
    await onUpdateConfig({ broadcast_msg: draft });
    toast({ title: 'Mensagem enviada!' });
    setDraft('');
  };

  const handleClear = async () => {
    await onUpdateConfig({ broadcast_msg: null });
    toast({ title: 'Mensagem removida' });
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Mensagem de Broadcast
        </h3>
        {broadcastMsg && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-sm">📢 {broadcastMsg}</p>
            <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={handleClear}>
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
  );
}
