import { describe, expect, it } from 'vitest';
import { countMatches, prizeRank } from './prizeRank.ts';

describe('countMatches', () => {
  it('counts the intersection size', () => {
    expect(countMatches([1, 2, 3, 4, 5], [3, 4, 5, 6, 7])).toBe(3);
    expect(countMatches([1, 2], [3, 4])).toBe(0);
    expect(countMatches([1, 2], [1, 2])).toBe(2);
  });
});

describe('prizeRank', () => {
  it('returns rank 1 for a perfect match', () => {
    expect(prizeRank(5, 2)).toBe(1);
  });

  it('returns each of the 13 official tiers exactly once', () => {
    const ranks = new Set<number>();
    for (let numbers = 0; numbers <= 5; numbers += 1) {
      for (let stars = 0; stars <= 2; stars += 1) {
        const rank = prizeRank(numbers, stars);
        if (rank !== null) ranks.add(rank);
      }
    }
    expect(ranks.size).toBe(13);
    expect([...ranks].sort((a, b) => a - b)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
  });

  it('returns null for combinations that win no prize', () => {
    expect(prizeRank(0, 0)).toBeNull();
    expect(prizeRank(1, 0)).toBeNull();
    expect(prizeRank(1, 1)).toBeNull();
    expect(prizeRank(0, 1)).toBeNull();
    expect(prizeRank(0, 2)).toBeNull();
  });
});
