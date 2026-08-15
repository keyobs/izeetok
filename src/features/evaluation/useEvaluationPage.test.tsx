import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import { evaluatedGridRepository } from '../../providers/evaluatedGridRepositoryInstance.ts';
import { useEvaluationPage } from './useEvaluationPage.ts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
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
    expect(evaluatedGridRepository.getLast()).toEqual({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
  });
});
