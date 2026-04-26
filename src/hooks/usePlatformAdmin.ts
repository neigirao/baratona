import { useEffect, useState } from 'react';
import { isSuperAdminApi } from '@/lib/api';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';

export function usePlatformAdmin() {
  const { user, loading: authLoading } = usePlatformAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    isSuperAdminApi(user.id)
      .then((ok) => { if (!cancelled) setIsSuperAdmin(ok); })
      .catch(() => { if (!cancelled) setIsSuperAdmin(false); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isSuperAdmin, loading: authLoading || loading, user };
}
