import { describe, it, expect, vi } from 'vitest';
import { normalizeSlug } from '@/lib/platformEvents';
import { isReservedSlug } from '@/lib/api/client';
import { withTimeout } from '@/lib/withTimeout';
import { mapEventRow } from '@/lib/api/mappers';

// ---------------------------------------------------------------------------
// normalizeSlug
// ---------------------------------------------------------------------------

describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('  Hello World  ')).toBe('hello-world');
  });

  it('converts spaces to hyphens and collapses multiples', () => {
    expect(normalizeSlug('foo   bar')).toBe('foo-bar');
  });

  it('strips accents', () => {
    expect(normalizeSlug('São Paulo')).toBe('sao-paulo');
    expect(normalizeSlug('Ação')).toBe('acao');
  });

  it('removes special characters', () => {
    expect(normalizeSlug('foo@bar!baz')).toBe('foobarbaz');
  });

  it('collapses repeated hyphens', () => {
    expect(normalizeSlug('foo--bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(normalizeSlug('-foo-')).toBe('foo');
  });

  it('returns empty string for blank input', () => {
    expect(normalizeSlug('')).toBe('');
    expect(normalizeSlug('   ')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// isReservedSlug
// ---------------------------------------------------------------------------

describe('isReservedSlug', () => {
  it('blocks reserved slugs', () => {
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('faq')).toBe(true);
    expect(isReservedSlug('nei')).toBe(true);
    expect(isReservedSlug('criar')).toBe(true);
  });

  it('allows non-reserved slugs', () => {
    expect(isReservedSlug('minha-baratona')).toBe(false);
    expect(isReservedSlug('comida-di-buteco')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

describe('withTimeout', () => {
  it('resolves when the promise settles before the deadline', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('rejects with "timeout" when the promise exceeds the deadline', async () => {
    vi.useFakeTimers();
    const never = new Promise<never>(() => {});
    const promise = withTimeout(never, 500);
    vi.advanceTimersByTime(600);
    await expect(promise).rejects.toThrow('timeout');
    vi.useRealTimers();
  });

  it('rejects with the original error when the promise rejects', async () => {
    const err = new Error('boom');
    await expect(withTimeout(Promise.reject(err), 1000)).rejects.toThrow('boom');
  });
});

// ---------------------------------------------------------------------------
// mapEventRow
// ---------------------------------------------------------------------------

const MINIMAL_ROW = {
  id: 'abc',
  slug: 'test-event',
  name: 'Test Event',
  description: 'desc',
  city: 'Rio de Janeiro',
  visibility: 'public',
  event_type: 'open_baratona',
  status: 'published',
  owner_user_id: 'user-1',
  owner_name: 'Owner',
  created_at: '2026-01-01T00:00:00Z',
  event_date: null,
  start_date: null,
  end_date: null,
  cover_image_url: null,
  external_source_url: null,
  updated_at: null,
};

describe('mapEventRow', () => {
  it('maps a complete DB row to a PlatformEvent', () => {
    const event = mapEventRow(MINIMAL_ROW);
    expect(event.id).toBe('abc');
    expect(event.slug).toBe('test-event');
    expect(event.name).toBe('Test Event');
    expect(event.status).toBe('published');
    expect(event.eventType).toBe('open_baratona');
  });

  it('defaults status to "draft" for unknown status values', () => {
    const event = mapEventRow({ ...MINIMAL_ROW, status: 'unknown_status' });
    expect(event.status).toBe('draft');
  });

  it('defaults city to "Rio de Janeiro" when missing', () => {
    const event = mapEventRow({ ...MINIMAL_ROW, city: undefined });
    expect(event.city).toBe('Rio de Janeiro');
  });

  it('handles null/undefined id gracefully', () => {
    const event = mapEventRow({ ...MINIMAL_ROW, id: null });
    expect(event.id).toBe('');
  });
});
