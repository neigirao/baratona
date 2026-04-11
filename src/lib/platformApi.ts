import { supabase } from '@/integrations/supabase/client';
import type { PlatformEvent } from '@/lib/platformEvents';

const RESERVED_SLUGS = new Set(['admin', 'api', 'faq', 'explorar', 'criar', 'nei']);

const db = supabase as any;

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
  };
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export async function listPublicEventsApi(): Promise<PlatformEvent[]> {
  const { data, error } = await db
    .from('events')
    .select('id, slug, name, description, city, visibility, event_type, owner_user_id, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function findEventBySlugApi(slug: string): Promise<PlatformEvent | null> {
  const { data, error } = await db
    .from('events')
    .select('id, slug, name, description, city, visibility, event_type, owner_user_id, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function ensureProfile(user: any) {
  if (!user) return;
  await db.from('profiles').upsert({
    id: user.id,
    display_name: user.user_metadata?.full_name || user.email,
    avatar_url: user.user_metadata?.avatar_url || null,
  });
}

export async function createEventApi(input: Omit<PlatformEvent, 'id' | 'createdAt'>): Promise<PlatformEvent> {
  const { data, error } = await db
    .from('events')
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
      city: input.city,
      visibility: input.visibility,
      event_type: input.eventType,
      owner_user_id: input.ownerId,
      status: 'published',
    })
    .select('id, slug, name, description, city, visibility, event_type, owner_user_id, created_at')
    .single();

  if (error) throw error;

  const { error: memberError } = await db.from('event_members').insert({
    event_id: data.id,
    user_id: input.ownerId,
    role: 'event_owner',
  });
  if (memberError) throw memberError;

  const { error: configError } = await db.from('event_app_config').insert({
    event_id: data.id,
    status: 'at_bar',
    global_delay_minutes: 0,
  });
  if (configError) throw configError;

  return mapRow(data);
}

export async function isSuperAdminApi(userId: string) {
  const { data, error } = await db
    .from('platform_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
