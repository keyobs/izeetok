import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGridInput } from './useGridInput.ts';

describe('useGridInput', () => {
  it('seeds inputs from initialGrid', () => {
    const { result } = renderHook(() =>
      useGridInput({ onSubmit: vi.fn(), initialGrid: { numbers: [3, 7, 19, 31, 42], stars: [2, 9] } }),
    );

    expect(result.current.numberInputs).toEqual(['3', '7', '19', '31', '42']);
    expect(result.current.starInputs).toEqual(['2', '9']);
  });

  it('flags a value repeated at an earlier index as invalid, not the first occurrence', () => {
    const { result } = renderHook(() =>
      useGridInput({ onSubmit: vi.fn(), initialGrid: { numbers: [3, 3, 19, 31, 42], stars: [2, 9] } }),
    );

    expect(result.current.numberValidities[0]).toBe('valid');
    expect(result.current.numberValidities[1]).toBe('invalid');
  });

  it('submits a valid grid and clears any error', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useGridInput({ onSubmit, initialGrid: { numbers: [3, 7, 19, 31, 42], stars: [2, 9] } }),
    );

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    expect(result.current.error).toBeNull();
  });

  it('sets an error instead of submitting when fields are incomplete', () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useGridInput({ onSubmit }));

    act(() => {
      result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
  });
});
