import { describe, expect, it } from 'vitest';
import { clampInt } from './clampInt.ts';

describe('clampInt', () => {
  it('rounds to the nearest integer', () => {
    expect(clampInt(3.7, -100, 100)).toBe(4);
    expect(clampInt(-3.7, -100, 100)).toBe(-4);
  });

  it('clamps values above the max', () => {
    expect(clampInt(10000000000000000000, -100, 100)).toBe(100);
  });

  it('clamps values below the min', () => {
    expect(clampInt(-10000000000000000000, -100, 100)).toBe(-100);
  });

  it('leaves in-range values untouched', () => {
    expect(clampInt(42, -100, 100)).toBe(42);
  });
});
