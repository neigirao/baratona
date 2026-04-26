import { supabase } from './client';
import { mapBarRow, type EventBar } from './mappers';

export type { EventBar } from './mappers';

// === Bar CRUD (owner or super_admin) ===

export interface BarInput {
  name: string;
  address?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  barOrder?: number;
  scheduledTime?: string | null;
  featuredDish?: string | null;
  dishDescription?: string | null;
  dishImageUrl?: string | null;
  phone?: string | null;
  instagram?: string | null;
}

function barInputToRow(input: BarInput) {
  return {
    name: input.name,
    address: input.address ?? '',
    neighborhood: input.neighborhood ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    bar_order: input.barOrder ?? 1,
    scheduled_time: input.scheduledTime ?? null,
    featured_dish: input.featuredDish ?? null,
    dish_description: input.dishDescription ?? null,
    dish_image_url: input.dishImageUrl ?? null,
    phone: input.phone ?? null,
    instagram: input.instagram ?? null,
  };
}

export async function createBarApi(eventId: string, input: BarInput): Promise<EventBar> {
  const { data, error } = await supabase
    .from('event_bars')
    .insert({ event_id: eventId, ...barInputToRow(input) })
    .select('*')
    .single();
  if (error) throw error;
  return mapBarRow(data);
}

export async function updateBarApi(barId: string, input: Partial<BarInput>): Promise<EventBar> {
  const patch: Record<string, any> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.address !== undefined) patch.address = input.address ?? '';
  if (input.neighborhood !== undefined) patch.neighborhood = input.neighborhood;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.barOrder !== undefined) patch.bar_order = input.barOrder;
  if (input.scheduledTime !== undefined) patch.scheduled_time = input.scheduledTime;
  if (input.featuredDish !== undefined) patch.featured_dish = input.featuredDish;
  if (input.dishDescription !== undefined) patch.dish_description = input.dishDescription;
  if (input.dishImageUrl !== undefined) patch.dish_image_url = input.dishImageUrl;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.instagram !== undefined) patch.instagram = input.instagram;

  const { data, error } = await supabase
    .from('event_bars')
    .update(patch)
    .eq('id', barId)
    .select('*')
    .single();
  if (error) throw error;
  return mapBarRow(data);
}

export async function deleteBarApi(barId: string): Promise<void> {
  const { error } = await supabase.from('event_bars').delete().eq('id', barId);
  if (error) throw error;
}

export async function reorderBarsApi(orderedBarIds: string[]): Promise<void> {
  // Updates one by one to respect RLS; small N (typically < 50) so OK.
  await Promise.all(
    orderedBarIds.map((id, idx) =>
      supabase.from('event_bars').update({ bar_order: idx + 1 }).eq('id', id),
    ),
  );
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

// === Bar favorites ===

export async function getBarFavoritesApi(eventId: string, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('event_bar_favorites' as any)
    .select('bar_id')
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data || []).map((r: any) => r.bar_id as string));
}

export async function getBarFavoriteCountsApi(eventId: string): Promise<Record<string, number>> {
  const { data, error } = await (supabase as any).rpc('get_bar_favorite_counts', { _event_id: eventId });
  if (error) return {};
  const out: Record<string, number> = {};
  for (const row of (data || []) as Array<{ bar_id: string; fav_count: number }>) {
    out[row.bar_id] = Number(row.fav_count) || 0;
  }
  return out;
}

export async function toggleBarFavoriteApi(
  eventId: string,
  userId: string,
  barId: string,
  shouldFavorite: boolean
): Promise<void> {
  if (shouldFavorite) {
    const { error } = await supabase
      .from('event_bar_favorites' as any)
      .insert({ event_id: eventId, user_id: userId, bar_id: barId });
    if (error && !String(error.message).includes('duplicate')) throw error;
  } else {
    const { error } = await supabase
      .from('event_bar_favorites' as any)
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('bar_id', barId);
    if (error) throw error;
  }
}

export async function createBaratonaFromFavoritesApi(
  sourceEventId: string,
  name: string,
  barIds: string[]
): Promise<{ slug: string; eventId: string }> {
  const { data, error } = await supabase.rpc('create_baratona_from_favorites' as any, {
    _source_event_id: sourceEventId,
    _name: name,
    _bar_ids: barIds,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('not_authenticated')) throw new Error('Faça login para criar sua baratona');
    if (msg.includes('too_few_bars')) throw new Error('Selecione no mínimo 3 bares');
    if (msg.includes('too_many_bars')) throw new Error('Máximo de 15 bares por baratona');
    if (msg.includes('no_bars_selected')) throw new Error('Nenhum bar selecionado');
    throw new Error('Não foi possível criar a baratona');
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Falha ao criar baratona');
  return { slug: (row as any).slug, eventId: (row as any).event_id };
}
