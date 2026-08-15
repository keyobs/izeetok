import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import { useDiscoveryPage } from './useDiscoveryPage.ts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useDiscoveryPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('discovers families and scatter series once the draws load', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useDiscoveryPage(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.discovery).not.toBeNull(), { timeout: 10000 });
    expect(result.current.discovery?.families.length).toBeGreaterThan(0);
    expect(result.current.scatterSeriesByCluster.length).toBeGreaterThan(0);
  });
});
