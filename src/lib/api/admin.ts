import { callRpc } from './client';
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
  const data = await callRpc<any>('admin_list_all_events', {});
  return data.map(mapEnrichedEventRow);
}

export async function adminUpdateEventOwnerApi(
  eventId: string,
  newOwnerUserId: string,
): Promise<void> {
  await callRpc('admin_update_event_owner', {
    _event_id: eventId,
    _new_owner: newOwnerUserId,
  });
}

export async function adminListPlatformRolesApi(): Promise<PlatformRoleRow[]> {
  const data = await callRpc<any>('admin_list_platform_roles', {});
  return data.map((r: any) => ({
    userId: r.user_id,
    role: r.role,
    createdAt: r.created_at,
    displayName: r.display_name ?? null,
  }));
}

export async function adminSetPlatformRoleApi(userId: string, role: string): Promise<void> {
  await callRpc('admin_set_platform_role', {
    _user_id: userId,
    _role: role,
  });
}

export async function adminRemovePlatformRoleApi(userId: string, role: string): Promise<void> {
  await callRpc('admin_remove_platform_role', {
    _user_id: userId,
    _role: role,
  });
}
