const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Wraps a promise with a timeout. Rejects with an Error('timeout') if the
 * promise hasn't resolved within `ms` milliseconds.
 */
export function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);
}
