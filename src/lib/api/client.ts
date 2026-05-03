/**
 * Centralized Supabase client re-export for the API layer.
 * Keeps domain modules decoupled from the integration path,
 * making it easy to swap or mock the client in tests.
 */
import { supabase as _supabase } from '@/integrations/supabase/client';

export { supabase } from '@/integrations/supabase/client';

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'faq', 'explorar', 'criar', 'nei',
  'entrar', 'minhas-baratonas', 'www', 'static', 'assets',
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

/** Typed wrapper for Supabase RPC calls (RPCs are not in generated types). */
export async function callRpc<T = unknown>(
  fn: string,
  args?: Record<string, unknown>
): Promise<T[]> {
  const { data, error } = await (_supabase as unknown as { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }).rpc(fn, args);
  if (error) throw error;
  return (data || []) as T[];
}
