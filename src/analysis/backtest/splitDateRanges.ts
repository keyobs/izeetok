import type { Draw } from '../draw/Draw.ts';
import type { DateRange } from './runWalkForwardBacktest.ts';

export interface TrainValidationTestRanges {
  train: DateRange;
  validation: DateRange;
  test: DateRange;
}

/**
 * Splits sorted history chronologically - train is the oldest slice,
 * validation the middle slice, test the most recent slice. Chronological
 * (not random) splitting is what keeps this consistent with the
 * walk-forward, no-future-leakage principle: test never precedes train.
 */
export const splitDateRanges = (
  draws: Draw[],
  trainRatio: number,
  validationRatio: number,
): TrainValidationTestRanges => {
  const sortedAscending = [...draws].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const total = sortedAscending.length;
  const trainEndIndex = Math.floor(total * trainRatio);
  const validationEndIndex = Math.floor(total * (trainRatio + validationRatio));

  const dateAt = (index: number): string => sortedAscending[Math.min(Math.max(index, 0), total - 1)].date;

  return {
    train: { start: dateAt(0), end: dateAt(trainEndIndex - 1) },
    validation: { start: dateAt(trainEndIndex), end: dateAt(validationEndIndex - 1) },
    test: { start: dateAt(validationEndIndex), end: dateAt(total - 1) },
  };
};
