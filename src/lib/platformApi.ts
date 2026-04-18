import { supabase } from '@/integrations/supabase/client';
import type { PlatformEvent } from '@/lib/platformEvents';

const RESERVED_SLUGS = new Set(['admin', 'api', 'faq', 'explorar', 'criar', 'nei']);

function mapRow(row: any): PlatformEvent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    city: row.city || 'Rio de Janeiro',
    visibility: row.visibility,
    eventType: row.event_type,
    ownerId: row.owner_user_id,
    ownerName: row.owner_name || 'Organizador',
    createdAt: row.created_at,
    eventDate: row.event_date || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    coverImageUrl: row.cover_image_url || null,
    externalSourceUrl: row.external_source_url || null,
  };
}

export interface EventBar {
  id?: string;
  eventId?: string;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  barOrder: number;
  scheduledTime: string | null;
  featuredDish?: string | null;
  dishDescription?: string | null;
  dishImageUrl?: string | null;
  neighborhood?: string | null;
  phone?: string | null;
  instagram?: string | null;
  externalId?: string | null;
}

function mapBarRow(row: any): EventBar {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    address: row.address || '',
    latitude: row.latitude,
    longitude: row.longitude,
    barOrder: row.bar_order,
    scheduledTime: row.scheduled_time,
    featuredDish: row.featured_dish || null,
    dishDescription: row.dish_description || null,
    dishImageUrl: row.dish_image_url || null,
    neighborhood: row.neighborhood || null,
    phone: row.phone || null,
    instagram: row.instagram || null,
    externalId: row.external_id || null,
  };
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export async function listPublicEventsApi(): Promise<PlatformEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function findEventBySlugApi(slug: string): Promise<PlatformEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function ensureProfile(user: any) {
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    user_id: user.id,
    display_name: user.user_metadata?.full_name || user.email,
    avatar_url: user.user_metadata?.avatar_url || null,
  });
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

  // Create member entry for owner
  await supabase.from('event_members').insert({
    event_id: data.id,
    user_id: input.ownerId,
    role: 'event_owner',
    display_name: input.ownerName,
  });

  // Create app config
  await supabase.from('event_app_config').insert({
    event_id: data.id,
    status: 'at_bar',
    global_delay_minutes: 0,
  });

  // Create bars if provided
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

  return mapRow(data);
}

export async function getEventBarsApi(eventId: string): Promise<EventBar[]> {
  const { data, error } = await supabase
    .from('event_bars')
    .select('*')
    .eq('event_id', eventId)
    .order('bar_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapBarRow);
}

export async function getEventBarCountApi(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_bars')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) return 0;
  return count || 0;
}

export async function getEventMemberCountApi(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_members')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) return 0;
  return count || 0;
}

export async function listPublicEventsWithBarCountApi(): Promise<(PlatformEvent & { barCount: number; memberCount: number })[]> {
  const events = await listPublicEventsApi();
  const enriched = await Promise.all(
    events.map(async (e) => ({
      ...e,
      barCount: await getEventBarCountApi(e.id),
      memberCount: await getEventMemberCountApi(e.id),
    }))
  );
  return enriched;
}

export async function listFeaturedEventsApi(limit = 3): Promise<(PlatformEvent & { barCount: number; memberCount: number })[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('visibility', 'public')
    .order('start_date', { ascending: true, nullsFirst: false })
    .order('event_date', { ascending: true, nullsFirst: false })
    .limit(20);
  if (error) throw error;

  const events = (data || []).map(mapRow);
  // Prioritize Comida di Buteco
  const FEATURED_SLUG = 'comida-di-buteco-rj-2026';
  const sorted = [
    ...events.filter((e) => e.slug === FEATURED_SLUG),
    ...events.filter((e) => e.slug !== FEATURED_SLUG),
  ].slice(0, limit);

  return Promise.all(
    sorted.map(async (e) => ({
      ...e,
      barCount: await getEventBarCountApi(e.id),
      memberCount: await getEventMemberCountApi(e.id),
    }))
  );
}

export interface DishRating {
  barId: string;
  averageScore: number;
  voteCount: number;
}

export async function getDishRatingsApi(eventId: string): Promise<Record<string, DishRating>> {
  const { data, error } = await supabase
    .from('event_votes')
    .select('bar_id, dish_score')
    .eq('event_id', eventId)
    .not('dish_score', 'is', null);

  if (error) return {};
  const byBar: Record<string, { sum: number; n: number }> = {};
  for (const row of data || []) {
    const id = (row as any).bar_id as string;
    const score = (row as any).dish_score as number;
    if (!byBar[id]) byBar[id] = { sum: 0, n: 0 };
    byBar[id].sum += score;
    byBar[id].n += 1;
  }
  const result: Record<string, DishRating> = {};
  for (const [barId, { sum, n }] of Object.entries(byBar)) {
    result[barId] = { barId, averageScore: sum / n, voteCount: n };
  }
  return result;
}

export async function isSuperAdminApi(userId: string) {
  const { data, error } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function joinEventApi(eventId: string, userId: string, displayName: string) {
  const { error } = await supabase.from('event_members').upsert({
    event_id: eventId,
    user_id: userId,
    role: 'participant',
    display_name: displayName,
  });
  if (error) throw error;
}

export interface EventInvite {
  id: string;
  eventId: string;
  code: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createInviteApi(
  eventId: string,
  opts: { maxUses?: number | null; expiresAt?: string | null } = {}
): Promise<EventInvite> {
  const { data, error } = await supabase
    .from('event_invites')
    .insert({
      event_id: eventId,
      code: generateInviteCode(),
      max_uses: opts.maxUses ?? 50,
      expires_at: opts.expiresAt ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return {
    id: data.id, eventId: data.event_id, code: data.code,
    maxUses: data.max_uses, usedCount: data.used_count || 0,
    expiresAt: data.expires_at, createdAt: data.created_at,
  };
}

export async function listInvitesApi(eventId: string): Promise<EventInvite[]> {
  const { data, error } = await supabase
    .from('event_invites')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id, eventId: d.event_id, code: d.code,
    maxUses: d.max_uses, usedCount: d.used_count || 0,
    expiresAt: d.expires_at, createdAt: d.created_at,
  }));
}

export async function deleteInviteApi(inviteId: string): Promise<void> {
  const { error } = await supabase.from('event_invites').delete().eq('id', inviteId);
  if (error) throw error;
}

export async function redeemInviteApi(code: string, displayName: string): Promise<{ slug: string; eventId: string }> {
  const { data, error } = await supabase.rpc('redeem_event_invite' as any, {
    _code: code.trim().toUpperCase(),
    _display_name: displayName,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('invite_not_found')) throw new Error('Código inválido');
    if (msg.includes('invite_expired')) throw new Error('Código expirado');
    if (msg.includes('invite_exhausted')) throw new Error('Código esgotou os usos');
    if (msg.includes('not_authenticated')) throw new Error('Faça login para usar o código');
    throw new Error('Não foi possível resgatar o convite');
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Código inválido');
  return { slug: (row as any).slug, eventId: (row as any).event_id };
}

export async function isEventMemberApi(eventId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_members')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
