import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../testing/testCsvFixture.ts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useDraws', () => {
  // drawRepository caches its CSV promise at module scope (by design, to
  // avoid re-fetching during a session) - each test needs its own fresh
  // module graph, otherwise a later test would silently reuse an earlier
  // test's cached fetch outcome instead of hitting its own mock.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the draws once the CSV request resolves', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const { useDraws } = await import('./useDraws.ts');

    const { result } = renderHook(() => useDraws(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.draws.length).toBeGreaterThan(0);
    expect(result.current.isError).toBe(false);
  });

  it('reports isError when the CSV request fails, and refetch retries it', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response(REAL_CSV_TEXT));
    vi.stubGlobal('fetch', fetchSpy);
    const { useDraws } = await import('./useDraws.ts');

    const { result } = renderHook(() => useDraws(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.draws).toEqual([]);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.draws.length).toBeGreaterThan(0);
  });
});
