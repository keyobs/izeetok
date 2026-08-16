import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
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

  it('computes scores and variations once a grid is submitted', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useEvaluationPage(), { wrapper });

    await waitFor(() => expect(result.current.isHistoryLoading).toBe(false));

    act(() => {
      result.current.onGridSubmit({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    });

    await waitFor(() => expect(result.current.scores).not.toBeNull());
    expect(result.current.variations).toHaveLength(3);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      numbers: [3, 7, 19, 31, 42],
      stars: [2, 9],
    });
  });
});
