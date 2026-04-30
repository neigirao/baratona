import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Participant = Database['public']['Tables']['participants']['Row'];

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    const { data, error } = await supabase.from('participants').select('*').order('name');
    if (!error && data) setParticipants(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchParticipants();
    const channel = supabase
      .channel('participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => fetchParticipants())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchParticipants]);

  return { participants, loading, refetch: fetchParticipants };
}
