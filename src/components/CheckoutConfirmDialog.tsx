import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBaratona } from '@/contexts/BaratonaContext';

interface CheckoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barName: string;
  onConfirm: () => void;
}

export function CheckoutConfirmDialog({ 
  open, 
  onOpenChange, 
  barName, 
  onConfirm 
}: CheckoutConfirmDialogProps) {
  const { language } = useBaratona();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === 'pt' ? 'Fazer check-out?' : 'Check out?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {language === 'pt' 
              ? `Tem certeza que quer sair do ${barName}? Você pode fazer check-in novamente depois.`
              : `Are you sure you want to leave ${barName}? You can check in again later.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {language === 'pt' ? 'Cancelar' : 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {language === 'pt' ? 'Sim, sair' : 'Yes, leave'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
