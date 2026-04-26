import { supabase } from './client';

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
