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

  it('mirrors raw text verbatim while typing, including interim states like a lone "-"', () => {
    const { result } = renderHook(() => useLaboratoryPage(), { wrapper });

    // A controlled input must always show exactly what was typed, or React
    // resyncs the DOM to the stale value on the next keystroke and the "-"
    // (the first character of any negative weight) gets wiped out.
    act(() => {
      result.current.updateRule('number-frequency', { weight: '-' });
    });
    expect(result.current.rulesState['number-frequency'].weight).toBe('-');

    act(() => {
      result.current.onSeedChange('10000000000000000000');
    });
    expect(result.current.seed).toBe('10000000000000000000');
  });

  it('clamps every bound to its real domain only when the experiment actually runs', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(REAL_CSV_TEXT)));
    const { result } = renderHook(() => useLaboratoryPage(), { wrapper });
    await waitFor(() => expect(result.current.isHistoryLoading).toBe(false));

    act(() => {
      result.current.onSeedChange('10000000000000000000');
      result.current.onTrainPercentChange('-5');
      result.current.onValidationPercentChange('500');
      result.current.onMonteCarloSampleCountChange('10000000000000000000');
      result.current.updateRule('number-frequency', { weight: '10000000000000000000' });
      result.current.updateRule('sum-range', { min: '1', max: '100000', enabled: true });
      result.current.updateRule('parity-target', { oddCount: '9', enabled: true });
    });

    act(() => {
      result.current.onRunExperiment();
    });

    expect(result.current.seed).toBe('999999');
    expect(result.current.trainPercent).toBe('0');
    expect(result.current.validationPercent).toBe('100');
    expect(result.current.monteCarloSampleCount).toBe('2000');
    expect(result.current.rulesState['number-frequency'].weight).toBe('100');
    expect(result.current.rulesState['sum-range']).toMatchObject({ min: '15', max: '240' });
    expect(result.current.rulesState['parity-target'].oddCount).toBe('5');
    expect(result.current.experiments[0].seed).toBe(999999);
  });
});
