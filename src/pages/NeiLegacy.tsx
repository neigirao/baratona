import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Index from './Index';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { isSuperAdminApi } from '@/lib/platformApi';

export default function NeiLegacy() {
  const { user, loading } = usePlatformAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return <Index />;
}
