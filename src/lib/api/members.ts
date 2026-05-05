import { supabase } from './client';

export async function getEventMemberCountApi(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('event_members')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (error) { console.error('[getEventMemberCountApi]', error); return 0; }
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
  if (error) {
    // Log clearly: a query failure here incorrectly denies access to the user.
    console.error('[isEventMemberApi] query failed — defaulting to false, may incorrectly deny access', error);
    return false;
  }
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

export async function removeEventMemberApi(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('event_members')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function isSuperAdminApi(userId: string) {
  const { data, error } = await supabase.rpc('has_platform_role', {
    _user_id: userId,
    _role: 'super_admin',
  });
  if (error) {
    console.error('[isSuperAdminApi] rpc failed — admin features will be unavailable', error);
    return false;
  }
  return Boolean(data);
}
