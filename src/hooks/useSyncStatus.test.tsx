import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncStatus } from './useSyncStatus';

describe('useSyncStatus', () => {
  it('inicia com secondsAgo em 0 e isRefreshing false', () => {
    const { result } = renderHook(() => useSyncStatus());

    expect(result.current.secondsAgo).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('controla ciclo de refresh', () => {
    const { result } = renderHook(() => useSyncStatus());

    act(() => {
      result.current.startRefresh();
    });
    expect(result.current.isRefreshing).toBe(true);

    act(() => {
      result.current.endRefresh();
    });
    expect(result.current.isRefreshing).toBe(false);
  });

  it('markUpdated reseta secondsAgo', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSyncStatus());

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(result.current.secondsAgo).toBeGreaterThanOrEqual(2);

    act(() => {
      result.current.markUpdated();
    });

    expect(result.current.secondsAgo).toBe(0);

    vi.useRealTimers();
  });
});
