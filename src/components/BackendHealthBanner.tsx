import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Health = 'unknown' | 'healthy' | 'degraded';

const POLL_MS = 60_000;
const TIMEOUT_MS = 8_000;

async function ping(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    // Light query against a public RPC. Counts only — fast.
    const { error } = await supabase
      .rpc('get_public_events_with_counts')
      .abortSignal(controller.signal);
    clearTimeout(timer);
    return !error;
  } catch {
    return false;
  }
}

export function BackendHealthBanner() {
  const [health, setHealth] = useState<Health>('unknown');
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function check() {
    setRetrying(true);
    const ok = await ping();
    setHealth(ok ? 'healthy' : 'degraded');
    setRetrying(false);
    if (ok) setDismissed(false);
  }

  useEffect(() => {
    let canceled = false;
    (async () => {
      // Avoid blocking initial render; wait one tick
      await new Promise((r) => setTimeout(r, 250));
      if (canceled) return;
      check();
    })();
    const id = window.setInterval(() => {
      if (!canceled) check();
    }, POLL_MS);
    const onOnline = () => check();
    window.addEventListener('online', onOnline);
    return () => {
      canceled = true;
      window.clearInterval(id);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (health !== 'degraded' || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[60] rounded-lg border border-destructive/40 bg-destructive/10 backdrop-blur p-3 shadow-lg flex items-start gap-3"
    >
      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="font-semibold text-sm">Conexão instável</p>
          <p className="text-xs text-muted-foreground">
            Não estamos conseguindo falar com o servidor. Algumas ações podem falhar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={check} disabled={retrying} className="h-7 text-xs">
            <RefreshCw className={`w-3 h-3 mr-1 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Testando...' : 'Tentar de novo'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-7 text-xs"
            aria-label="Dispensar aviso"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
