import { isEventStatus, type PlatformEvent } from '@/lib/platformEvents';

export interface EventBar {
  id?: string;
  eventId?: string;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  barOrder: number;
  scheduledTime: string | null;
  featuredDish?: string | null;
  dishDescription?: string | null;
  dishImageUrl?: string | null;
  neighborhood?: string | null;
  phone?: string | null;
  instagram?: string | null;
  externalId?: string | null;
}

export function mapEventRow(row: any): PlatformEvent {
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
    eventDate: row.event_date || null,
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    coverImageUrl: row.cover_image_url || null,
    externalSourceUrl: row.external_source_url || null,
  };
}

export function mapBarRow(row: any): EventBar {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    address: row.address || '',
    latitude: row.latitude,
    longitude: row.longitude,
    barOrder: row.bar_order,
    scheduledTime: row.scheduled_time,
    featuredDish: row.featured_dish || null,
    dishDescription: row.dish_description || null,
    dishImageUrl: row.dish_image_url || null,
    neighborhood: row.neighborhood || null,
    phone: row.phone || null,
    instagram: row.instagram || null,
    externalId: row.external_id || null,
  };
}

export function mapEnrichedEventRow(row: any): PlatformEvent & { barCount: number; memberCount: number } {
  return {
    ...mapEventRow(row),
    barCount: Number(row.bar_count ?? 0),
    memberCount: Number(row.member_count ?? 0),
  };
}
