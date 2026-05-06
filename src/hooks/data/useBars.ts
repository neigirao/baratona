import type { Database } from '@/integrations/supabase/types';
import { useLegacyTable } from './useLegacyTable';

type Bar = Database['public']['Tables']['bars']['Row'];

export function useBars() {
  const { data: bars, loading, refetch } = useLegacyTable<Bar>('bars', { orderBy: 'bar_order' });
  return { bars, loading, refetch };
}
