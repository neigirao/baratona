import { z } from 'zod';
import { supabase, callRpc } from './client';
import { mapEventRow, mapEnrichedEventRow, type EventBar } from './mappers';
import { isEventStatus, type EventStatus, type PlatformEvent } from '@/lib/platformEvents';
import { FEATURED_EVENT_SLUG } from '@/lib/constants';

// ── Zod schemas ──────────────────────────────────────────────────────────────

const CreateEventSchema = z.object({
  slug: z.string().min(1, 'Slug obrigatório').max(100).regex(/^[a-z0-9-]+$/, 'Slug inválido: use apenas letras, números e hífens'),
  name: z.string().min(1, 'Nome obrigatório').max(200, 'Nome muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional().default(''),
  city: z.string().min(1, 'Cidade obrigatória').max(100),
  visibility: z.enum(['public', 'private']),
  eventType: z.enum(['open_baratona', 'special_circuit']),
  ownerId: z.string().min(1, 'Owner obrigatório'),
  ownerName: z.string().min(1).max(200),
  eventDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'live', 'finished', 'archived']).optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  externalSourceUrl: z.string().url().nullable().optional(),
});

export interface EventUpdateInput {
  name?: string;
  description?: string | null;
  city?: string | null;
  visibility?: 'public' | 'private';
  eventType?: 'open_baratona' | 'special_circuit';
  status?: EventStatus;
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
  const data = await callRpc('get_public_events_with_counts');
  return data.map(mapEnrichedEventRow);
}

export async function listFeaturedEventsApi(limit = 3): Promise<(PlatformEvent & { barCount: number; memberCount: number })[]> {
  const all = await listPublicEventsWithBarCountApi();
  const sorted = [
    ...all.filter((e) => e.slug === FEATURED_EVENT_SLUG),
    ...all.filter((e) => e.slug !== FEATURED_EVENT_SLUG),
  ];
  return sorted.slice(0, limit);
}

export async function createEventApi(
  input: Omit<PlatformEvent, 'id' | 'createdAt'>,
  bars: Omit<EventBar, 'id' | 'eventId'>[] = []
): Promise<PlatformEvent> {
  const validated = CreateEventSchema.parse({
    slug: input.slug,
    name: input.name,
    description: input.description,
    city: input.city,
    visibility: input.visibility,
    eventType: input.eventType,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    eventDate: input.eventDate,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    coverImageUrl: input.coverImageUrl,
    externalSourceUrl: input.externalSourceUrl,
  });
  const status: EventStatus = isEventStatus(validated.status) ? validated.status! : 'published';
  const { data, error } = await supabase
    .from('events')
    .insert({
      slug: validated.slug,
      name: validated.name,
      description: validated.description,
      city: validated.city,
      visibility: validated.visibility,
      event_type: validated.eventType,
      owner_user_id: validated.ownerId,
      owner_name: validated.ownerName,
      event_date: validated.eventDate || null,
      status,
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
  const data = await callRpc('get_events_by_owner', { _owner_id: userId });
  return data.map(mapEnrichedEventRow);
}

export async function listEventsJoinedByUserApi(
  userId: string
): Promise<(PlatformEvent & { barCount: number; memberCount: number; role: string })[]> {
  const data = await callRpc<Record<string, unknown>>('get_events_joined_by_user', { _user_id: userId });
  return data.map((row) => ({
    ...mapEnrichedEventRow(row),
    role: typeof row.member_role === 'string' ? row.member_role : 'participant',
  }));
}
