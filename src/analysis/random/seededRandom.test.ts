import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './seededRandom.ts';

describe('createSeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);

    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());

    expect(sequenceA).toEqual(sequenceB);
  });

  it('produces a different sequence for a different seed', () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);

    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());

    expect(sequenceA).not.toEqual(sequenceB);
  });

  it('produces values in [0, 1)', () => {
    const random = createSeededRandom(7);

    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
