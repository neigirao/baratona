import { supabase } from './client';
import { mapEventRow, mapEnrichedEventRow, type EventBar } from './mappers';
import type { PlatformEvent } from '@/lib/platformEvents';

export interface EventUpdateInput {
  name?: string;
  description?: string | null;
  city?: string | null;
  visibility?: 'public' | 'private';
  eventType?: 'open_baratona' | 'special_circuit';
  status?: string;
  eventDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  externalSourceUrl?: string | null;
  ownerName?: string | null;
  slug?: string;
}

export async function updateEventApi(eventId: string, input: EventUpdateInput): Promise<PlatformEvent> {
  const patch: Record<string, any> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description ?? '';
  if (input.city !== undefined) patch.city = input.city;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.eventType !== undefined) patch.event_type = input.eventType;
  if (input.status !== undefined) patch.status = input.status;
  if (input.eventDate !== undefined) patch.event_date = input.eventDate;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.endDate !== undefined) patch.end_date = input.endDate;
  if (input.coverImageUrl !== undefined) patch.cover_image_url = input.coverImageUrl;
  if (input.externalSourceUrl !== undefined) patch.external_source_url = input.externalSourceUrl;
  if (input.ownerName !== undefined) patch.owner_name = input.ownerName;
  if (input.slug !== undefined) patch.slug = input.slug;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', eventId)
    .select('*')
    .single();
  if (error) throw error;
  return mapEventRow(data);
}

export async function archiveEventApi(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;
}

export async function listPublicEventsApi(): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEventRow);
}

export async function findEventBySlugApi(slug: string): Promise<PlatformEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEventRow(data) : null;
}

export async function listPublicEventsWithBarCountApi(): Promise<(PlatformEvent & { barCount: number; memberCount: number })[]> {
  const { data, error } = await (supabase as any).rpc('get_public_events_with_counts');
  if (error) throw error;
  return (data || []).map(mapEnrichedEventRow);
}

export async function listFeaturedEventsApi(limit = 3): Promise<(PlatformEvent & { barCount: number; memberCount: number })[]> {
  const all = await listPublicEventsWithBarCountApi();
  const FEATURED_SLUG = 'comida-di-buteco-rj-2026';
  const sorted = [
    ...all.filter((e) => e.slug === FEATURED_SLUG),
    ...all.filter((e) => e.slug !== FEATURED_SLUG),
  ];
  return sorted.slice(0, limit);
}

export async function createEventApi(
  input: Omit<PlatformEvent, 'id' | 'createdAt'>,
  bars: Omit<EventBar, 'id' | 'eventId'>[] = []
): Promise<PlatformEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
      city: input.city,
      visibility: input.visibility,
      event_type: input.eventType,
      owner_user_id: input.ownerId,
      owner_name: input.ownerName,
      event_date: input.eventDate || null,
      status: 'published',
    })
    .select('*')
    .single();
  if (error) throw error;

  await supabase.from('event_members').insert({
    event_id: data.id,
    user_id: input.ownerId,
    role: 'event_owner',
    display_name: input.ownerName,
  });

  await supabase.from('event_app_config').insert({
    event_id: data.id,
    status: 'at_bar',
    global_delay_minutes: 0,
  });

  if (bars.length > 0) {
    const barRows = bars.map((b) => ({
      event_id: data.id,
      name: b.name,
      address: b.address,
      latitude: b.latitude || null,
      longitude: b.longitude || null,
      bar_order: b.barOrder,
      scheduled_time: b.scheduledTime,
    }));
    const { error: barsError } = await supabase.from('event_bars').insert(barRows);
    if (barsError) throw barsError;
  }

  return mapEventRow(data);
}

export async function listEventsByOwnerApi(userId: string): Promise<(PlatformEvent & { barCount: number; memberCount: number })[]> {
  const { getEventBarCountApi } = await import('./bars');
  const { getEventMemberCountApi } = await import('./members');
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const events = (data || []).map(mapEventRow);
  return Promise.all(
    events.map(async (e) => ({
      ...e,
      barCount: await getEventBarCountApi(e.id),
      memberCount: await getEventMemberCountApi(e.id),
    }))
  );
}

export async function listEventsJoinedByUserApi(
  userId: string
): Promise<(PlatformEvent & { barCount: number; memberCount: number; role: string })[]> {
  const { getEventBarCountApi } = await import('./bars');
  const { getEventMemberCountApi } = await import('./members');
  const { data: members, error: mErr } = await supabase
    .from('event_members')
    .select('event_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (mErr) throw mErr;
  const ids = Array.from(new Set((members || []).map((m: any) => m.event_id)));
  if (ids.length === 0) return [];
  const { data: events, error: eErr } = await supabase
    .from('events')
    .select('*')
    .in('id', ids);
  if (eErr) throw eErr;
  const roleById: Record<string, string> = {};
  (members || []).forEach((m: any) => { roleById[m.event_id] = m.role; });
  const mapped = (events || []).map(mapEventRow);
  const orderIndex: Record<string, number> = {};
  ids.forEach((id, i) => { orderIndex[id] = i; });
  mapped.sort((a, b) => (orderIndex[a.id] ?? 0) - (orderIndex[b.id] ?? 0));
  return Promise.all(
    mapped.map(async (e) => ({
      ...e,
      barCount: await getEventBarCountApi(e.id),
      memberCount: await getEventMemberCountApi(e.id),
      role: roleById[e.id] || 'participant',
    }))
  );
}
