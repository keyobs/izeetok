/**
 * Rule kinds cover every V2-spec category except "zone géométrique" -
 * that one targets a SpatialEmbedding region, which doesn't exist as a
 * real clustered thing before V3's DiscoveryModel.
 *
 * Scoring kinds (number-frequency, above-31, repeat-from-previous,
 * recency, star-frequency) contribute a weighted [0,1] preference per
 * number/star; a negative weight flips the preference (e.g.
 * number-frequency with weight -1 prefers rare numbers instead of
 * frequent ones - fréquences and rareté are the same rule, signed).
 * Constraint kinds (decade-spread, sum-range, parity-target) target a
 * property of the whole 5-number set and are applied as a bounded
 * greedy adjustment after the initial scored selection.
 */
export type StrategyRuleKind =
  | 'number-frequency'
  | 'above-31'
  | 'repeat-from-previous'
  | 'recency'
  | 'decade-spread'
  | 'sum-range'
  | 'parity-target'
  | 'star-frequency';

export interface StrategyRuleParams {
  min?: number;
  max?: number;
  oddCount?: number;
}

export interface StrategyRule {
  kind: StrategyRuleKind;
  weight?: number;
  params?: StrategyRuleParams;
}

export interface Strategy {
  id: string;
  name: string;
  rules: StrategyRule[];
  seed: number;
}
