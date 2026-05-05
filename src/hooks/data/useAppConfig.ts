import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { isLegacyReadOnly } from '@/lib/legacyMode';
import { toast } from 'sonner';

type AppConfig = Database['public']['Tables']['app_config']['Row'];

export function useAppConfig() {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`app-config-${crypto.randomUUID()}`);
  const fetchVersion = useRef(0);

  const fetchConfig = useCallback(async () => {
    const v = ++fetchVersion.current;
    const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
    if (!error && data && v === fetchVersion.current) setAppConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => fetchConfig())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConfig]);

  const updateConfig = useCallback(async (updates: Partial<Omit<AppConfig, 'id' | 'updated_at'>>) => {
    if (isLegacyReadOnly()) {
      toast.info('Evento legado em modo somente leitura.');
      return false;
    }
    const { error } = await supabase.from('app_config').update(updates).eq('id', 1);
    if (error) { console.error('Error updating config:', error); return false; }
    return true;
  }, []);

  return { appConfig, loading, updateConfig, refetch: fetchConfig };
}
