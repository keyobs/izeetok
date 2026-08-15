import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import { useDrawsPage } from './useDrawsPage.ts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useDrawsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to the 50 most recent draws, toggling to the full history', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useDrawsPage(), { wrapper });

    await waitFor(() => expect(result.current.hasData).toBe(true));
    expect(result.current.rows).toHaveLength(50);
    expect(result.current.showAll).toBe(false);

    act(() => {
      result.current.toggleShowAll();
    });

    await waitFor(() => expect(result.current.showAll).toBe(true));
    expect(result.current.rows.length).toBeGreaterThan(50);
  });
});
