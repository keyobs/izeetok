import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { REAL_CSV_TEXT } from '../../testing/testCsvFixture.ts';
import { useLaboratoryPage } from './useLaboratoryPage.ts';

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useLaboratoryPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs an experiment and selects it', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));

    const { result } = renderHook(() => useLaboratoryPage(), { wrapper });

    await waitFor(() => expect(result.current.isHistoryLoading).toBe(false));

    act(() => {
      result.current.onRunExperiment();
    });

    expect(result.current.experiments).toHaveLength(1);
    expect(result.current.selectedExperiment?.id).toBe(result.current.experiments[0].id);
  });

  it('toggles a temporal window and computes the test percentage', () => {
    const { result } = renderHook(() => useLaboratoryPage(), { wrapper });

    expect(result.current.testPercent).toBe(15);
    expect(result.current.selectedWindows).toEqual(['all']);

    act(() => {
      result.current.toggleWindow(3);
    });

    expect(result.current.selectedWindows).toEqual(['all', 3]);
  });
});
