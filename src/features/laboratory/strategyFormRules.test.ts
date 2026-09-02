import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES_STATE, buildRulesFromState, clampRulesStateToText, parseClampedInt } from './strategyFormRules.ts';

describe('buildRulesFromState', () => {
  it('only includes enabled rules', () => {
    const rules = buildRulesFromState(DEFAULT_RULES_STATE);

    expect(rules.map((r) => r.kind).sort()).toEqual(['number-frequency', 'star-frequency']);
  });

  it('carries params for sum-range and parity-target, weight for scoring kinds', () => {
    const state = {
      ...DEFAULT_RULES_STATE,
      'sum-range': { enabled: true, weight: '1', min: '90', max: '130' },
      'parity-target': { enabled: true, weight: '1', oddCount: '4' },
      'above-31': { enabled: true, weight: '-2' },
    };

    const rules = buildRulesFromState(state);

    expect(rules).toContainEqual({ kind: 'sum-range', params: { min: 90, max: 130 } });
    expect(rules).toContainEqual({ kind: 'parity-target', params: { oddCount: 4 } });
    expect(rules).toContainEqual({ kind: 'above-31', weight: -2 });
  });

  it('carries no params for decade-spread', () => {
    const state = { ...DEFAULT_RULES_STATE, 'decade-spread': { enabled: true, weight: '1' } };

    const rules = buildRulesFromState(state);

    expect(rules).toContainEqual({ kind: 'decade-spread' });
  });

  it('parses garbage or out-of-range text as the nearest in-range value', () => {
    const state = {
      ...DEFAULT_RULES_STATE,
      'above-31': { enabled: true, weight: '10000000000000000000' },
    };

    const rules = buildRulesFromState(state);

    expect(rules).toContainEqual({ kind: 'above-31', weight: 100 });
  });
});

describe('parseClampedInt', () => {
  it('falls back to 0 (then clamps) for empty, incomplete or garbage text', () => {
    expect(parseClampedInt('', -100, 100)).toBe(0);
    expect(parseClampedInt('-', -100, 100)).toBe(0);
    expect(parseClampedInt(undefined, -100, 100)).toBe(0);
    expect(parseClampedInt('abc', -100, 100)).toBe(0);
  });

  it('rounds and clamps valid text', () => {
    expect(parseClampedInt('3.7', -100, 100)).toBe(4);
    expect(parseClampedInt('10000000000000000000', -100, 100)).toBe(100);
    expect(parseClampedInt('-10000000000000000000', -100, 100)).toBe(-100);
  });
});

describe('clampRulesStateToText', () => {
  it('produces the canonical clamped text for every field', () => {
    const state = {
      ...DEFAULT_RULES_STATE,
      'above-31': { enabled: true, weight: '10000000000000000000' },
      'sum-range': { enabled: true, weight: '1', min: '1', max: '100000' },
      'parity-target': { enabled: true, weight: '1', oddCount: '9' },
    };

    const clamped = clampRulesStateToText(state);

    expect(clamped['above-31'].weight).toBe('100');
    expect(clamped['sum-range']).toMatchObject({ min: '15', max: '240' });
    expect(clamped['parity-target'].oddCount).toBe('5');
  });
});
