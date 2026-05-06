import type { EventStatus } from '@/lib/platformEvents';

const STATUS_CLASSES: Record<string, string> = {
  published: 'bg-success/15 text-success border-success/30',
  live: 'bg-success/20 text-success border-success/40',
  finished: 'bg-muted text-muted-foreground border-border',
  draft: 'bg-warning/15 text-warning border-warning/30',
  archived: 'bg-destructive/10 text-destructive border-destructive/20',
};

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  live: 'Ao vivo',
  finished: 'Finalizado',
  draft: 'Rascunho',
  archived: 'Arquivado',
};

interface StatusBadgeProps {
  status: EventStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_CLASSES[status] ?? 'bg-muted'} ${className}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
