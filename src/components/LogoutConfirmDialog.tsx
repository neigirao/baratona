import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useBaratona } from '@/contexts/BaratonaContext';

interface LogoutConfirmDialogProps {
  onConfirm: () => void;
  trigger?: React.ReactNode;
}

export function LogoutConfirmDialog({ onConfirm, trigger }: LogoutConfirmDialogProps) {
  const { language } = useBaratona();
  
  const texts = {
    pt: {
      title: 'Trocar de usuário?',
      description: 'Tem certeza que deseja sair? Você precisará selecionar seu nome novamente.',
      cancel: 'Cancelar',
      confirm: 'Sair',
    },
    en: {
      title: 'Switch user?',
      description: 'Are you sure you want to log out? You will need to select your name again.',
      cancel: 'Cancel',
      confirm: 'Log out',
    },
  };
  
  const t = texts[language];

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">{t.confirm}</span>
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
