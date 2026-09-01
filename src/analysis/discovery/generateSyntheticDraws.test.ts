import { describe, expect, it } from 'vitest';
import { generateSyntheticDraws } from './generateSyntheticDraws.ts';

describe('generateSyntheticDraws', () => {
  it('produces the requested count of valid, distinct-dated draws', () => {
    const draws = generateSyntheticDraws(200, 42, '2020-01-01');

    expect(draws).toHaveLength(200);
    const dates = new Set(draws.map((draw) => draw.date));
    expect(dates.size).toBe(200);
    for (const draw of draws) {
      expect(new Set(draw.numbers).size).toBe(5);
      expect(new Set(draw.stars).size).toBe(2);
      expect(draw.numbers.every((n) => n >= 1 && n <= 50)).toBe(true);
      expect(draw.stars.every((s) => s >= 1 && s <= 12)).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateSyntheticDraws(50, 7, '2020-01-01');
    const b = generateSyntheticDraws(50, 7, '2020-01-01');

    expect(a).toEqual(b);
  });

  it('produces different draws for a different seed', () => {
    const a = generateSyntheticDraws(50, 1, '2020-01-01');
    const b = generateSyntheticDraws(50, 2, '2020-01-01');

    expect(a).not.toEqual(b);
  });
});
