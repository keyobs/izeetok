import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import { evaluatedGridRepository } from '../../providers/evaluatedGridRepositoryInstance.ts';
import { useGeometryPage } from './useGeometryPage.ts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useGeometryPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('defaults to the latest draw and computes 10 neighbors once loaded', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useGeometryPage(), { wrapper });

    await waitFor(() => expect(result.current.referenceGrid).not.toBeNull());
    expect(result.current.source).toBe('latest');
    expect(result.current.isEvaluatedSourceAvailable).toBe(false);
    expect(result.current.neighbors).toHaveLength(10);
  });

  it('defaults to the evaluated grid when one was saved', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    evaluatedGridRepository.save({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    const { result } = renderHook(() => useGeometryPage(), { wrapper });

    await waitFor(() => expect(result.current.referenceGrid).not.toBeNull());
    expect(result.current.source).toBe('evaluated');
    expect(result.current.isEvaluatedSourceAvailable).toBe(true);
    expect(result.current.referenceGrid).toEqual({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
  });

  it('switches to a custom grid on submit', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useGeometryPage(), { wrapper });
    await waitFor(() => expect(result.current.referenceGrid).not.toBeNull());

    act(() => {
      result.current.onSourceChange('custom');
    });
    expect(result.current.referenceGrid).toBeNull();

    act(() => {
      result.current.onCustomGridSubmit({ numbers: [4, 8, 15, 23, 44], stars: [1, 5] });
    });
    expect(result.current.referenceGrid).toEqual({ numbers: [4, 8, 15, 23, 44], stars: [1, 5] });
  });
});
