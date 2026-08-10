import { describe, expect, it } from 'vitest';
import type { BacktestMetrics } from './runWalkForwardBacktest.ts';
import { detectOverfitting } from './detectOverfitting.ts';

const metricsWith = (meanMatchedNumbers: number): BacktestMetrics => ({
  stepCount: 10,
  meanMatchedNumbers,
  meanMatchedStars: 0.5,
  bestPrizeRank: null,
  prizeRankCounts: {},
});

describe('detectOverfitting', () => {
  it('flags overfitting when train far exceeds validation and test', () => {
    const signal = detectOverfitting(metricsWith(3.5), metricsWith(1.0), metricsWith(0.9));

    expect(signal.isLikelyOverfit).toBe(true);
  });

  it('does not flag overfitting when train/validation/test are comparable', () => {
    const signal = detectOverfitting(metricsWith(1.2), metricsWith(1.1), metricsWith(1.0));

    expect(signal.isLikelyOverfit).toBe(false);
  });

  it('does not flag overfitting when test happens to beat train ("no advantage" is a valid outcome)', () => {
    const signal = detectOverfitting(metricsWith(0.8), metricsWith(0.9), metricsWith(1.1));

    expect(signal.isLikelyOverfit).toBe(false);
  });
});
