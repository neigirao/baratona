import type { Database } from '@/integrations/supabase/types';
import { useLegacyTable } from './useLegacyTable';

type Participant = Database['public']['Tables']['participants']['Row'];

export function useParticipants() {
  const { data: participants, loading, refetch } = useLegacyTable<Participant>('participants', { orderBy: 'name' });
  return { participants, loading, refetch };
}
