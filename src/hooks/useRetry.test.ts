import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './useRetry';

describe('withRetry', () => {
  it('retorna sucesso na primeira tentativa', async () => {
    const op = vi.fn().mockResolvedValue('ok');

    const result = await withRetry(op, { maxAttempts: 3, baseDelay: 1 });

    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('faz retry e succeeds antes do limite', async () => {
    vi.useFakeTimers();
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('falha 1'))
      .mockRejectedValueOnce(new Error('falha 2'))
      .mockResolvedValue('ok');

    const promise = withRetry(op, { maxAttempts: 3, baseDelay: 10, maxDelay: 20 });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('lança erro após esgotar tentativas', async () => {
    vi.useFakeTimers();
    const op = vi.fn().mockRejectedValue(new Error('sempre falha'));

    const promise = withRetry(op, { maxAttempts: 2, baseDelay: 10 });

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('sempre falha');
    expect(op).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
