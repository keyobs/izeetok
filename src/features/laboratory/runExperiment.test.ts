import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../api/parseFdjCsv.ts';
import { TEMPORAL_WINDOWS } from '../../analysis/scoring/TemporalWindow.ts';
import type { Strategy } from '../../analysis/strategy/Strategy.ts';
import { runExperiment } from './runExperiment.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const draws = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

const strategyOf = (rules: Strategy['rules'], seed = 42): Strategy => ({
  id: 'test-strategy',
  name: 'Test',
  rules,
  seed,
});

describe('runExperiment', () => {
  it('produces a fully-populated Experiment with generatedGrids matching the test-range steps', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }, { kind: 'recency' }]);

    const experiment = runExperiment({
      strategy,
      draws,
      trainRatio: 0.7,
      validationRatio: 0.15,
      windows: TEMPORAL_WINDOWS,
      monteCarloSampleCount: 50,
    });

    expect(experiment.id).toBeTruthy();
    expect(experiment.results.generatedGrids.length).toBe(experiment.results.metrics.stepCount);
    expect(experiment.results.baselineComparisons).toHaveLength(5);
    expect(experiment.windowComparisons).toHaveLength(TEMPORAL_WINDOWS.length);
    expect(experiment.monteCarlo.sampleCount).toBe(50);
    expect(typeof experiment.overfitting.isLikelyOverfit).toBe('boolean');

    for (const generated of experiment.results.generatedGrids) {
      expect(generated.geometry.grid).toEqual(generated.grid);
      expect(generated.score).toBeGreaterThanOrEqual(0);
      expect(generated.score).toBeLessThanOrEqual(5);
    }
  });

  it('is reproducible: the same strategy/seed/config gives the same experiment results', () => {
    const strategy = strategyOf([{ kind: 'above-31', weight: 2 }], 7);
    const config = { strategy, draws, trainRatio: 0.7, validationRatio: 0.15, windows: TEMPORAL_WINDOWS, monteCarloSampleCount: 20 };

    const a = runExperiment(config);
    const b = runExperiment(config);

    expect(a.results).toEqual(b.results);
    expect(a.overfitting).toEqual(b.overfitting);
    expect(a.monteCarlo).toEqual(b.monteCarlo);
    expect(a.windowComparisons).toEqual(b.windowComparisons);
  });

  it('supports a strategy with no rules and still reports a valid ("no advantage detected") result', () => {
    const strategy = strategyOf([], 1);

    const experiment = runExperiment({
      strategy,
      draws,
      trainRatio: 0.7,
      validationRatio: 0.15,
      windows: ['all'],
      monteCarloSampleCount: 30,
    });

    expect(experiment.monteCarlo.strategyPercentile).toBeGreaterThanOrEqual(0);
    expect(experiment.monteCarlo.strategyPercentile).toBeLessThanOrEqual(100);
  });
});
