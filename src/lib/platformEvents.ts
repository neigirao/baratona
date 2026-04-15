export type EventVisibility = 'public' | 'private';
export type EventType = 'open_baratona' | 'special_circuit';

export interface PlatformEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  visibility: EventVisibility;
  eventType: EventType;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  eventDate?: string | null;
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
