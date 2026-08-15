import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES_STATE, buildRulesFromState } from './strategyFormRules.ts';

describe('buildRulesFromState', () => {
  it('only includes enabled rules', () => {
    const rules = buildRulesFromState(DEFAULT_RULES_STATE);

    expect(rules.map((r) => r.kind).sort()).toEqual(['number-frequency', 'star-frequency']);
  });

  it('carries params for sum-range and parity-target, weight for scoring kinds', () => {
    const state = {
      ...DEFAULT_RULES_STATE,
      'sum-range': { enabled: true, weight: 1, min: 90, max: 130 },
      'parity-target': { enabled: true, weight: 1, oddCount: 4 },
      'above-31': { enabled: true, weight: -2 },
    };

    const rules = buildRulesFromState(state);

    expect(rules).toContainEqual({ kind: 'sum-range', params: { min: 90, max: 130 } });
    expect(rules).toContainEqual({ kind: 'parity-target', params: { oddCount: 4 } });
    expect(rules).toContainEqual({ kind: 'above-31', weight: -2 });
  });

  it('carries no params for decade-spread', () => {
    const state = { ...DEFAULT_RULES_STATE, 'decade-spread': { enabled: true, weight: 1 } };

    const rules = buildRulesFromState(state);

    expect(rules).toContainEqual({ kind: 'decade-spread' });
  });
});
