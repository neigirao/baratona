import { supabase, callRpc } from './client';

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

function mapInvite(d: any): EventInvite {
  return {
    id: d.id,
    eventId: d.event_id,
    code: d.code,
    maxUses: d.max_uses,
    usedCount: d.used_count || 0,
    expiresAt: d.expires_at,
    createdAt: d.created_at,
  };
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
  return mapInvite(data);
}

export async function listInvitesApi(eventId: string): Promise<EventInvite[]> {
  const { data, error } = await supabase
    .from('event_invites')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapInvite);
}

export async function deleteInviteApi(inviteId: string): Promise<void> {
  const { error } = await supabase.from('event_invites').delete().eq('id', inviteId);
  if (error) throw error;
}

export async function redeemInviteApi(code: string, displayName: string): Promise<{ slug: string; eventId: string }> {
  const data = await callRpc<{ slug: string; event_id: string }>('redeem_event_invite', {
    _code: code.trim().toUpperCase(),
    _display_name: displayName,
  }).catch((error: Error) => {
    const msg = error.message || '';
    if (msg.includes('invite_not_found')) throw new Error('Código inválido');
    if (msg.includes('invite_expired')) throw new Error('Código expirado');
    if (msg.includes('invite_exhausted')) throw new Error('Código esgotou os usos');
    if (msg.includes('not_authenticated')) throw new Error('Faça login para usar o código');
    throw new Error('Não foi possível resgatar o convite');
  });
  const row = data[0];
  if (!row) throw new Error('Código inválido');
  return { slug: row.slug, eventId: row.event_id };
}
