import { supabase } from './client';

export async function getEventMemberCountApi(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_members')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (error) return 0;
  return count || 0;
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

export async function ensureProfile(user: any) {
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    user_id: user.id,
    display_name: user.user_metadata?.full_name || user.email,
    avatar_url: user.user_metadata?.avatar_url || null,
  });
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
