import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useHighContrast } from '@/hooks/useHighContrast';

interface Props {
  className?: string;
}

export function HighContrastToggle({ className }: Props) {
  const { enabled, toggle } = useHighContrast();
  return (
    <Button
      variant={enabled ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      className={`h-8 w-8 p-0 ${className ?? ''}`}
      aria-label={enabled ? 'Desativar alto contraste' : 'Ativar alto contraste'}
      aria-pressed={enabled}
      title={enabled ? 'Alto contraste ativo' : 'Ativar alto contraste'}
    >
      {enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </Button>
  );
}
