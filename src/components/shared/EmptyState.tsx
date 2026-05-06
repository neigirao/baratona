import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 text-center ${className}`}>
      {icon && <div className="text-muted-foreground/50">{icon}</div>}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
