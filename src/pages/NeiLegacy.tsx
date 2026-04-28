import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Index from './Index';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { isSuperAdminApi } from '@/lib/platformApi';
import { setLegacyReadOnly } from '@/lib/legacyMode';
import { Lock } from 'lucide-react';

export default function NeiLegacy() {
  const { user, loading } = usePlatformAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLegacyReadOnly(true);
    return () => setLegacyReadOnly(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      setIsSuperAdmin(false);
      return;
    }
    isSuperAdminApi(user.id)
      .then(setIsSuperAdmin)
      .catch(() => setError('Falha ao validar permissões.'))
      .finally(() => setChecking(false));
  }, [user]);

  if (loading || checking) {
    return <div className="p-8">Carregando...</div>;
  }
  if (error) return <div className="p-8 text-destructive">{error}</div>;

  if (!user || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <div className="sticky top-0 z-50 bg-amber-500/90 text-black text-xs sm:text-sm py-2 px-3 flex items-center justify-center gap-2 font-semibold backdrop-blur-sm">
        <Lock className="w-3.5 h-3.5" />
        <span>Modo somente leitura — evento legado /nei</span>
      </div>
      <Index />
    </>
  );
}
