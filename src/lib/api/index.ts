/**
 * Public API barrel.
 * Domain-grouped modules under src/lib/api/* — re-exported here
 * so existing imports from '@/lib/platformApi' keep working.
 */
export { isReservedSlug, supabase } from './client';
export type { EventBar } from './mappers';
export {
  listPublicEventsApi,
  findEventBySlugApi,
  listPublicEventsWithBarCountApi,
  listFeaturedEventsApi,
  createEventApi,
  listEventsByOwnerApi,
  listEventsJoinedByUserApi,
} from './events';
export {
  getEventBarsApi,
  getEventBarCountApi,
  getBarFavoritesApi,
  getBarFavoriteCountsApi,
  toggleBarFavoriteApi,
  createBaratonaFromFavoritesApi,
} from './bars';
export {
  getEventMemberCountApi,
  joinEventApi,
  isEventMemberApi,
  ensureProfile,
  isSuperAdminApi,
} from './members';
export { getDishRatingsApi, type DishRating } from './votes';
export {
  createInviteApi,
  listInvitesApi,
  deleteInviteApi,
  redeemInviteApi,
  type EventInvite,
} from './invites';
