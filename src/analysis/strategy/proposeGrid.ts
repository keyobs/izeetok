import type { Draw } from '../draw/Draw.ts';
import type { Grid } from '../grid/Grid.ts';
import { parseGrid } from '../grid/Grid.ts';
import { createSeededRandom } from '../random/seededRandom.ts';
import type { Strategy, StrategyRule, StrategyRuleParams } from './Strategy.ts';

const range = (min: number, max: number): number[] =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);

const decadeBucketOf = (n: number): number => Math.min(Math.floor((n - 1) / 10), 4);

const countByValue = (values: number[], min: number, max: number): Record<number, number> => {
  const counts: Record<number, number> = {};
  for (let v = min; v <= max; v += 1) counts[v] = 0;
  for (const v of values) counts[v] += 1;
  return counts;
};

const normalizeToUnit = (values: Record<number, number>): Record<number, number> => {
  const max = Math.max(1, ...Object.values(values));
  const normalized: Record<number, number> = {};
  for (const [key, value] of Object.entries(values)) normalized[Number(key)] = value / max;
  return normalized;
};

const sortedByDateDescending = (draws: Draw[]): Draw[] =>
  [...draws].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const gapsSinceLastSeen = (
  sortedDescending: Draw[],
  min: number,
  max: number,
  pick: (draw: Draw) => readonly number[],
): Record<number, number> => {
  const gaps: Record<number, number> = {};
  for (let n = min; n <= max; n += 1) gaps[n] = Number.POSITIVE_INFINITY;

  for (const [index, draw] of sortedDescending.entries()) {
    for (const n of pick(draw)) {
      if (!Number.isFinite(gaps[n])) gaps[n] = index;
    }
  }

  return gaps;
};

const scoreNumbers = (rules: StrategyRule[], history: Draw[]): Record<number, number> => {
  const scores: Record<number, number> = {};
  for (let n = 1; n <= 50; n += 1) scores[n] = 0;

  const needsFrequency = rules.some((rule) => rule.kind === 'number-frequency');
  const needsRepeat = rules.some((rule) => rule.kind === 'repeat-from-previous');
  const needsRecency = rules.some((rule) => rule.kind === 'recency');

  const sortedDescending = needsRepeat || needsRecency ? sortedByDateDescending(history) : [];
  const mostRecentDraw = sortedDescending[0];
  const normalizedFrequency = needsFrequency
    ? normalizeToUnit(countByValue(history.flatMap((draw) => draw.numbers), 1, 50))
    : {};
  const gaps = needsRecency ? gapsSinceLastSeen(sortedDescending, 1, 50, (draw) => draw.numbers) : {};

  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    if (rule.kind === 'number-frequency') {
      for (let n = 1; n <= 50; n += 1) scores[n] += weight * normalizedFrequency[n];
    } else if (rule.kind === 'above-31') {
      for (let n = 1; n <= 50; n += 1) scores[n] += weight * (n > 31 ? 1 : 0);
    } else if (rule.kind === 'repeat-from-previous') {
      for (let n = 1; n <= 50; n += 1) {
        scores[n] += weight * (mostRecentDraw?.numbers.includes(n) ? 1 : 0);
      }
    } else if (rule.kind === 'recency') {
      for (let n = 1; n <= 50; n += 1) scores[n] += weight * (1 / (1 + gaps[n]));
    }
  }

  return scores;
};

const scoreStars = (rules: StrategyRule[], history: Draw[]): Record<number, number> => {
  const scores: Record<number, number> = {};
  for (let s = 1; s <= 12; s += 1) scores[s] = 0;

  if (!rules.some((rule) => rule.kind === 'star-frequency')) return scores;

  const normalizedFrequency = normalizeToUnit(countByValue(history.flatMap((draw) => draw.stars), 1, 12));

  for (const rule of rules) {
    if (rule.kind === 'star-frequency') {
      const weight = rule.weight ?? 1;
      for (let s = 1; s <= 12; s += 1) scores[s] += weight * normalizedFrequency[s];
    }
  }

  return scores;
};

const topN = (
  scores: Record<number, number>,
  min: number,
  max: number,
  count: number,
  random: () => number,
): number[] =>
  range(min, max)
    .map((n) => ({ n, jitteredScore: scores[n] + random() * 1e-6 }))
    .sort((a, b) => b.jitteredScore - a.jitteredScore)
    .slice(0, count)
    .map((entry) => entry.n)
    .sort((a, b) => a - b);

const applyDecadeSpread = (numbers: number[], scores: Record<number, number>): number[] => {
  let current = [...numbers];

  for (let pass = 0; pass < 10; pass += 1) {
    const buckets = [0, 0, 0, 0, 0];
    for (const n of current) buckets[decadeBucketOf(n)] += 1;

    const overIndex = buckets.findIndex((count) => count >= 2);
    const underIndex = buckets.findIndex((count) => count === 0);
    if (overIndex === -1 || underIndex === -1) break;

    const worstInOverDecade = current
      .filter((n) => decadeBucketOf(n) === overIndex)
      .sort((a, b) => scores[a] - scores[b])[0];

    const underDecadeMin = underIndex * 10 + 1;
    const underDecadeMax = Math.min(underIndex * 10 + 10, 50);
    const bestReplacement = range(underDecadeMin, underDecadeMax)
      .filter((n) => !current.includes(n))
      .sort((a, b) => scores[b] - scores[a])[0];

    if (bestReplacement === undefined) break;
    current = current.map((n) => (n === worstInOverDecade ? bestReplacement : n));
  }

  return current;
};

const applySumRange = (numbers: number[], scores: Record<number, number>, params: StrategyRuleParams): number[] => {
  const min = params.min ?? 0;
  const max = params.max ?? 250;
  let current = [...numbers];

  for (let pass = 0; pass < 20; pass += 1) {
    const sum = current.reduce((acc, n) => acc + n, 0);
    if (sum >= min && sum <= max) break;

    const needsIncrease = sum < min;
    const worst = [...current].sort((a, b) => scores[a] - scores[b])[0];
    const replacement = range(1, 50)
      .filter((n) => !current.includes(n) && (needsIncrease ? n > worst : n < worst))
      .sort((a, b) => scores[b] - scores[a])[0];

    if (replacement === undefined) break;
    current = current.map((n) => (n === worst ? replacement : n));
  }

  return current;
};

const applyParityTarget = (
  numbers: number[],
  scores: Record<number, number>,
  params: StrategyRuleParams,
): number[] => {
  const targetOddCount = params.oddCount ?? 3;
  let current = [...numbers];

  for (let pass = 0; pass < 10; pass += 1) {
    const currentOddCount = current.filter((n) => n % 2 !== 0).length;
    if (currentOddCount === targetOddCount) break;

    const needsMoreOdd = currentOddCount < targetOddCount;
    const worst = [...current].sort((a, b) => scores[a] - scores[b]).find((n) => (needsMoreOdd ? n % 2 === 0 : n % 2 !== 0));
    if (worst === undefined) break;

    const replacement = range(1, 50)
      .filter((n) => !current.includes(n) && (needsMoreOdd ? n % 2 !== 0 : n % 2 === 0))
      .sort((a, b) => scores[b] - scores[a])[0];

    if (replacement === undefined) break;
    current = current.map((n) => (n === worst ? replacement : n));
  }

  return current;
};

export const proposeGrid = (strategy: Strategy, history: Draw[]): Grid => {
  const random = createSeededRandom(strategy.seed);
  const numberScores = scoreNumbers(strategy.rules, history);
  const starScores = scoreStars(strategy.rules, history);

  let numbers = topN(numberScores, 1, 50, 5, random);
  const stars = topN(starScores, 1, 12, 2, random);

  for (const rule of strategy.rules) {
    if (rule.kind === 'decade-spread') numbers = applyDecadeSpread(numbers, numberScores);
    if (rule.kind === 'sum-range') numbers = applySumRange(numbers, numberScores, rule.params ?? {});
    if (rule.kind === 'parity-target') numbers = applyParityTarget(numbers, numberScores, rule.params ?? {});
  }

  return parseGrid({ numbers, stars });
};
