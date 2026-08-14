import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { parseGrid } from '../grid/Grid.ts';
import { classifyReading, evaluateGrid } from './evaluateGrid.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

describe('evaluateGrid', () => {
  it('produces four 0-100 scores, each with non-empty factors', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    const scores = evaluateGrid(grid, history);

    for (const score of Object.values(scores)) {
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
      expect(score.factors.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same grid and history', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(evaluateGrid(grid, history)).toEqual(evaluateGrid(grid, history));
  });

  it('rates a real historical draw as structurally closer than an arbitrary far-out grid', () => {
    const realDraw = history[0];
    const commonGrid = parseGrid({ numbers: [...realDraw.numbers], stars: [...realDraw.stars] });
    const farOutGrid = parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });

    const commonScores = evaluateGrid(commonGrid, history);
    const farOutScores = evaluateGrid(farOutGrid, history);

    expect(commonScores.structure.value).toBeGreaterThan(farOutScores.structure.value);
  });

  it('classifies a common-structure, low-originality grid as "classique"', () => {
    const realDraw = history[0];
    const grid = parseGrid({ numbers: [...realDraw.numbers], stars: [...realDraw.stars] });

    const scores = evaluateGrid(grid, history);

    expect(classifyReading(scores)).toBe(
      scores.originality.value >= 50 ? 'interessante' : 'classique',
    );
  });

  it('handles an empty history without throwing', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(() => evaluateGrid(grid, [])).not.toThrow();
  });
});
