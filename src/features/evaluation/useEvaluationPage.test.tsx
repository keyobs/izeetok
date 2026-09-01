import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import EvaluatedGridProvider from '../../providers/EvaluatedGridProvider.tsx';
import { useEvaluationPage } from './useEvaluationPage.ts';

const STORAGE_KEY = 'izeetok:evaluated-grid';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <EvaluatedGridProvider>{children}</EvaluatedGridProvider>
    </QueryClientProvider>
  );
};

describe('useEvaluationPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('computes scores and variations once a grid is already evaluated', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] }));

    const { result } = renderHook(() => useEvaluationPage(), { wrapper });

    await waitFor(() => expect(result.current.scores).not.toBeNull());
    expect(result.current.variations).toHaveLength(3);
  });

  it('has no grid and no scores when nothing has been evaluated yet', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useEvaluationPage(), { wrapper });

    await waitFor(() => expect(result.current.isHistoryLoading).toBe(false));
    expect(result.current.grid).toBeNull();
    expect(result.current.scores).toBeNull();
  });
});
