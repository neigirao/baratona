import { useCallback, useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

const STORAGE_KEY = 'baratona:high-contrast';
const CLASS_NAME = 'contrast-boost';

function readInitial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function applyClass(enabled: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(CLASS_NAME, enabled);
}

/**
 * Boosts contrast for use in dimly lit / sunny / noisy bar environments.
 * Adds the `contrast-boost` class on <html>, picked up by index.css overrides.
 */
export function useHighContrast() {
  const [enabled, setEnabled] = useState<boolean>(readInitial);

  useEffect(() => {
    applyClass(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      // noop
    }
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      track('high_contrast_toggled', { enabled: next });
      return next;
    });
  }, []);

  return { enabled, toggle };
}

// Apply on first import so the page boots in the user's saved mode without flash.
if (typeof window !== 'undefined') {
  applyClass(readInitial());
}
