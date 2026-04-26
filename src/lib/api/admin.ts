import { supabase } from './client';
import type { PlatformEvent } from '@/lib/platformEvents';
import { mapEnrichedEventRow } from './mappers';

export interface PlatformRoleRow {
  userId: string;
  role: string;
  createdAt: string;
  displayName: string | null;
}

export async function adminListAllEventsApi(): Promise<
  (PlatformEvent & { barCount: number; memberCount: number })[]
> {
  const { data, error } = await (supabase as any).rpc('admin_list_all_events');
  if (error) throw error;
  return (data || []).map(mapEnrichedEventRow);
}

export async function adminUpdateEventOwnerApi(
  eventId: string,
  newOwnerUserId: string,
): Promise<void> {
  const { error } = await (supabase as any).rpc('admin_update_event_owner', {
    _event_id: eventId,
    _new_owner: newOwnerUserId,
  });
  if (error) throw error;
}

export async function adminListPlatformRolesApi(): Promise<PlatformRoleRow[]> {
  const { data, error } = await (supabase as any).rpc('admin_list_platform_roles');
  if (error) throw error;
  return (data || []).map((r: any) => ({
    userId: r.user_id,
    role: r.role,
    createdAt: r.created_at,
    displayName: r.display_name ?? null,
  }));
}

export async function adminSetPlatformRoleApi(userId: string, role: string): Promise<void> {
  const { error } = await (supabase as any).rpc('admin_set_platform_role', {
    _user_id: userId,
    _role: role,
  });
  if (error) throw error;
}

export async function adminRemovePlatformRoleApi(userId: string, role: string): Promise<void> {
  const { error } = await (supabase as any).rpc('admin_remove_platform_role', {
    _user_id: userId,
    _role: role,
  });
  if (error) throw error;
}
