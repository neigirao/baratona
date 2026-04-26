/**
 * Centralized Supabase client re-export for the API layer.
 * Keeps domain modules decoupled from the integration path,
 * making it easy to swap or mock the client in tests.
 */
export { supabase } from '@/integrations/supabase/client';

const RESERVED_SLUGS = new Set(['admin', 'api', 'faq', 'explorar', 'criar', 'nei']);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}
