import { callRpc } from './client';
import type { PlatformEvent } from '@/lib/platformEvents';
import { mapEnrichedEventRow } from './mappers';

export interface PlatformStats {
  totalEvents: number;
  activeEvents: number;
  finishedEvents: number;
  draftEvents: number;
  archivedEvents: number;
  circuitEvents: number;
  totalUsers: number;
  usersLast7d: number;
  usersLast30d: number;
  totalMembers: number;
  totalCheckins: number;
  totalConsumption: number;
  eventsLast7d: number;
  eventsLast30d: number;
  recurringCreators: number;
  avgMembersPerEvent: number;
  avgBarsPerEvent: number;
  eventsByMonth: { month: string; total: number }[];
}

export async function adminGetPlatformStatsApi(): Promise<PlatformStats> {
  const raw = await callRpc<any>('admin_get_platform_stats', {});
  const d = Array.isArray(raw) ? raw[0] : raw;
  return {
    totalEvents: Number(d.total_events ?? 0),
    activeEvents: Number(d.active_events ?? 0),
    finishedEvents: Number(d.finished_events ?? 0),
    draftEvents: Number(d.draft_events ?? 0),
    archivedEvents: Number(d.archived_events ?? 0),
    circuitEvents: Number(d.circuit_events ?? 0),
    totalUsers: Number(d.total_users ?? 0),
    usersLast7d: Number(d.users_last_7d ?? 0),
    usersLast30d: Number(d.users_last_30d ?? 0),
    totalMembers: Number(d.total_members ?? 0),
    totalCheckins: Number(d.total_checkins ?? 0),
    totalConsumption: Number(d.total_consumption ?? 0),
    eventsLast7d: Number(d.events_last_7d ?? 0),
    eventsLast30d: Number(d.events_last_30d ?? 0),
    recurringCreators: Number(d.recurring_creators ?? 0),
    avgMembersPerEvent: Number(d.avg_members_per_event ?? 0),
    avgBarsPerEvent: Number(d.avg_bars_per_event ?? 0),
    eventsByMonth: d.events_by_month ?? [],
  };
}

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

export interface PlatformUserRow {
  userId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: string[];
  eventsOwned: number;
  eventsJoined: number;
}

export async function adminListUsersApi(
  search?: string,
  limit = 100,
  offset = 0,
): Promise<PlatformUserRow[]> {
  const data = await callRpc<any>('admin_list_users', {
    _search: search ?? null,
    _limit: limit,
    _offset: offset,
  });
  return data.map((r: any) => ({
    userId: r.user_id,
    email: r.email ?? null,
    displayName: r.display_name ?? null,
    avatarUrl: r.avatar_url ?? null,
    createdAt: r.created_at,
    lastSignInAt: r.last_sign_in_at ?? null,
    roles: r.roles ?? [],
    eventsOwned: Number(r.events_owned ?? 0),
    eventsJoined: Number(r.events_joined ?? 0),
  }));
}
