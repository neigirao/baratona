import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Bar = Database['public']['Tables']['bars']['Row'];

export function useBars() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBars = useCallback(async () => {
    const { data, error } = await supabase.from('bars').select('*').order('bar_order');
    if (!error && data) setBars(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBars();
    const channel = supabase
      .channel('bars-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bars' }, () => fetchBars())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBars]);

  return { bars, loading, refetch: fetchBars };
}
