import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LoadErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export function LoadError({
  title = 'Não foi possível carregar',
  message = 'Verifique sua conexão e tente novamente.',
  onRetry,
  retrying = false,
  compact = false,
}: LoadErrorProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center text-center gap-3 ${
        compact ? 'py-6' : 'py-12'
      } px-4 rounded-lg border border-dashed border-destructive/40 bg-destructive/5`}
    >
      <AlertCircle className="w-8 h-8 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Tentando...' : 'Tentar novamente'}
        </Button>
      )}
    </div>
  );
}
