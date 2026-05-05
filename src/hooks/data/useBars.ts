import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Bar = Database['public']['Tables']['bars']['Row'];

export function useBars() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useRef(`bars-${crypto.randomUUID()}`);
  const fetchVersion = useRef(0);

  const fetchBars = useCallback(async () => {
    const v = ++fetchVersion.current;
    const { data, error } = await supabase.from('bars').select('*').order('bar_order');
    if (!error && data && v === fetchVersion.current) setBars(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBars();
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bars' }, () => fetchBars())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBars]);

  return { bars, loading, refetch: fetchBars };
}
