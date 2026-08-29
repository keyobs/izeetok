import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import EvaluatedGridProvider from '../../providers/EvaluatedGridProvider.tsx';
import { useDrawsPage } from './useDrawsPage.ts';

const STORAGE_KEY = 'izeetok:evaluated-grid';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <EvaluatedGridProvider>{children}</EvaluatedGridProvider>
    </QueryClientProvider>
  );
};

describe('useDrawsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
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

  it('disables highlighting when no grid has been evaluated yet', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useDrawsPage(), { wrapper });

    await waitFor(() => expect(result.current.hasData).toBe(true));
    expect(result.current.isHighlightAvailable).toBe(false);
    expect(result.current.highlightGrid).toBeNull();
  });

  it('toggles highlighting the evaluated grid on and off', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] }));

    const { result } = renderHook(() => useDrawsPage(), { wrapper });

    await waitFor(() => expect(result.current.hasData).toBe(true));
    expect(result.current.isHighlightAvailable).toBe(true);
    expect(result.current.highlightGrid).toBeNull();

    act(() => {
      result.current.onToggleHighlight();
    });
    expect(result.current.highlightGrid).toEqual({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    act(() => {
      result.current.onToggleHighlight();
    });
    expect(result.current.highlightGrid).toBeNull();
  });
});
