import type { Database } from '@/integrations/supabase/types';
import { useRealtimeTable } from './useRealtimeTable';

type EventMember = Database['public']['Tables']['event_members']['Row'];

export function useEventMembers(eventId: string | null) {
  const { data: members, loading, refetch } = useRealtimeTable<EventMember>('event_members', eventId);
  return { members, loading, refetch };
}
