export type EventVisibility = 'public' | 'private';
export type EventType = 'open_baratona' | 'special_circuit';
export type EventStatus = 'draft' | 'published' | 'live' | 'finished' | 'archived';

export const EVENT_STATUSES: readonly EventStatus[] = ['draft', 'published', 'live', 'finished', 'archived'] as const;

export function isEventStatus(value: unknown): value is EventStatus {
  return typeof value === 'string' && (EVENT_STATUSES as readonly string[]).includes(value);
}

export interface PlatformEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  visibility: EventVisibility;
  eventType: EventType;
  status?: EventStatus;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  eventDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  externalSourceUrl?: string | null;
}

export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
