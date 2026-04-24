/**
 * Lightweight analytics wrapper.
 *
 * Default: logs to console in dev, stores last 50 events in sessionStorage for debugging.
 * If `window.plausible` is detected (Plausible script loaded externally), forwards events.
 * No PII. Events are domain-named (snake_case verbs).
 */

type EventProps = Record<string, string | number | boolean | null | undefined>;

const STORAGE_KEY = 'baratona:analytics-trail';
const MAX_TRAIL = 50;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: EventProps }) => void;
  }
}

function pushTrail(event: string, props?: EventProps) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const arr: Array<{ t: number; e: string; p?: EventProps }> = raw ? JSON.parse(raw) : [];
    arr.push({ t: Date.now(), e: event, p: props });
    while (arr.length > MAX_TRAIL) arr.shift();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // sessionStorage may be unavailable (private mode, etc.)
  }
}

export function track(event: string, props?: EventProps) {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.plausible === 'function') {
      window.plausible(event, props ? { props } : undefined);
    }
    if (import.meta.env?.DEV) {
       
      console.debug('[analytics]', event, props ?? '');
    }
    pushTrail(event, props);
  } catch {
    // never break the UI for analytics
  }
}

export function getTrail() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
