import type { BacktestMetrics } from './runWalkForwardBacktest.ts';

export interface OverfittingSignal {
  isLikelyOverfit: boolean;
  trainMeanMatchedNumbers: number;
  validationMeanMatchedNumbers: number;
  testMeanMatchedNumbers: number;
  reason: string;
}

// Out of a 0-5 matched-numbers scale; a train/validation-or-test gap past
// this is treated as a meaningful divergence rather than ordinary noise.
const OVERFIT_GAP_THRESHOLD = 0.75;

export const detectOverfitting = (
  trainMetrics: BacktestMetrics,
  validationMetrics: BacktestMetrics,
  testMetrics: BacktestMetrics,
): OverfittingSignal => {
  const trainMean = trainMetrics.meanMatchedNumbers;
  const validationMean = validationMetrics.meanMatchedNumbers;
  const testMean = testMetrics.meanMatchedNumbers;

  const isLikelyOverfit =
    trainMean - validationMean > OVERFIT_GAP_THRESHOLD || trainMean - testMean > OVERFIT_GAP_THRESHOLD;

  const reason = isLikelyOverfit
    ? `Train (${trainMean.toFixed(2)} numéros en moyenne) nettement supérieur à validation (${validationMean.toFixed(2)}) et/ou test (${testMean.toFixed(2)}).`
    : 'Aucun signe net de surapprentissage : performances train/validation/test comparables.';

  return {
    isLikelyOverfit,
    trainMeanMatchedNumbers: trainMean,
    validationMeanMatchedNumbers: validationMean,
    testMeanMatchedNumbers: testMean,
    reason,
  };
};
