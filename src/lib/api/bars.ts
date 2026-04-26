import { supabase } from './client';
import { mapBarRow, type EventBar } from './mappers';

export type { EventBar } from './mappers';

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
