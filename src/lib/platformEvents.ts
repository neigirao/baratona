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
}

const STORAGE_KEY = 'baratona_platform_events_v1';

const seed: PlatformEvent[] = [
  {
    id: 'legacy-nei',
    slug: 'nei',
    name: 'Baratona da Nei',
    description: 'Evento legado da aplicação original.',
    city: 'Rio de Janeiro',
    visibility: 'private',
    eventType: 'open_baratona',
    ownerId: 'legacy-admin',
    ownerName: 'Nei',
    createdAt: new Date().toISOString(),
  },
];

export function getPlatformEvents(): PlatformEvent[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as PlatformEvent[];
    return parsed.length ? parsed : seed;
  } catch {
    return seed;
  }
}

export function savePlatformEvents(events: PlatformEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function createPlatformEvent(input: Omit<PlatformEvent, 'id' | 'createdAt'>): PlatformEvent {
  const event: PlatformEvent = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const all = getPlatformEvents();
  all.push(event);
  savePlatformEvents(all);

  return event;
}

export function getPublicEvents() {
  return getPlatformEvents().filter((event) => event.visibility === 'public');
}

export function findEventBySlug(slug: string) {
  return getPlatformEvents().find((event) => event.slug === slug);
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
