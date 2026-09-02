import { clampInt } from '../../utils/clampInt.ts';
import type { StrategyRule, StrategyRuleKind } from '../../analysis/strategy/Strategy.ts';

// Every numeric field is stored as the raw text the user typed, not a
// parsed number. A controlled <input> whose value prop lags behind what
// was actually typed (e.g. staying "1" while an invalid interim state like
// "-" or "" is on screen) gets its DOM value forcibly resynced by React on
// the next keystroke, which is indistinguishable from the app eating
// keystrokes - typing a negative number becomes impossible. Mirroring the
// raw text exactly, and only parsing/clamping at the point of use
// (buildRulesFromState), avoids that entirely.
export interface RuleConfigState {
  enabled: boolean;
  weight: string;
  min?: string;
  max?: string;
  oddCount?: string;
}

export type RulesState = Record<StrategyRuleKind, RuleConfigState>;

// A weight is a multiplier with no natural domain of its own - -100/+100
// is a deliberate, arbitrary safety bound (see CLAUDE.md). Sum and odd
// count do have a real domain: 5 numbers between 1 and 50 sum to at
// least 15 and at most 240, and can have 0 to 5 odd numbers among them.
export const WEIGHT_MIN = -100;
export const WEIGHT_MAX = 100;
export const SUM_MIN = 15;
export const SUM_MAX = 240;
export const ODD_COUNT_MIN = 0;
export const ODD_COUNT_MAX = 5;

export const RULE_KINDS: StrategyRuleKind[] = [
  'number-frequency',
  'above-31',
  'repeat-from-previous',
  'recency',
  'decade-spread',
  'sum-range',
  'parity-target',
  'star-frequency',
];

export const SCORING_KINDS: StrategyRuleKind[] = [
  'number-frequency',
  'above-31',
  'repeat-from-previous',
  'recency',
  'star-frequency',
];

export const RULE_LABELS: Record<StrategyRuleKind, string> = {
  'number-frequency': 'Fréquence des numéros (poids négatif = rareté)',
  'above-31': 'Favoriser les numéros > 31',
  'repeat-from-previous': 'Répétition du tirage précédent',
  recency: 'Proximité récente (poids négatif = numéros en retard)',
  'decade-spread': 'Répartition par dizaine (signature)',
  'sum-range': 'Plage de somme',
  'parity-target': 'Parité cible',
  'star-frequency': 'Fréquence des étoiles',
};

export const RULE_DESCRIPTIONS: Record<StrategyRuleKind, string> = {
  'number-frequency':
    "Favorise les numéros les plus sortis dans l'historique. Poids négatif : favorise au contraire les numéros les moins sortis.",
  'above-31': 'Donne un bonus fixe à tous les numéros supérieurs à 31, sans regarder leur historique.',
  'repeat-from-previous': 'Favorise les numéros présents dans le tout dernier tirage enregistré.',
  recency:
    "Favorise les numéros sortis récemment. Poids négatif : favorise au contraire les numéros absents depuis longtemps (\"en retard\").",
  'decade-spread':
    'Répartit les 5 numéros sur des dizaines différentes (1-10, 11-20, ... 41-50) plutôt que de les laisser se concentrer.',
  'sum-range': 'Remplace des numéros jusqu\'à ce que la somme des 5 numéros tombe dans la plage choisie.',
  'parity-target': 'Remplace des numéros jusqu\'à atteindre le nombre de numéros impairs souhaité.',
  'star-frequency': "Favorise les étoiles les plus sorties dans l'historique.",
};

export const DEFAULT_RULES_STATE: RulesState = {
  'number-frequency': { enabled: true, weight: '1' },
  'above-31': { enabled: false, weight: '1' },
  'repeat-from-previous': { enabled: false, weight: '1' },
  recency: { enabled: false, weight: '1' },
  'decade-spread': { enabled: false, weight: '1' },
  'sum-range': { enabled: false, weight: '1', min: '100', max: '150' },
  'parity-target': { enabled: false, weight: '1', oddCount: '3' },
  'star-frequency': { enabled: true, weight: '1' },
};

// Empty, incomplete ("-") or garbage text all parse to NaN, which falls
// back to 0 before clamping - the same "invalid input becomes the nearest
// in-range value" rule applied everywhere else on this page.
export const parseClampedInt = (raw: string | undefined, min: number, max: number): number => {
  const parsed = Number(raw);
  return clampInt(Number.isNaN(parsed) ? 0 : parsed, min, max);
};

// Produces the canonical (clamped, integer, stringified) text for every
// field, so the form can display exactly what an experiment run actually
// used instead of whatever raw text was left sitting in an input.
export const clampRulesStateToText = (state: RulesState): RulesState =>
  RULE_KINDS.reduce((clamped, kind) => {
    const config = state[kind];
    clamped[kind] = {
      ...config,
      weight: String(parseClampedInt(config.weight, WEIGHT_MIN, WEIGHT_MAX)),
      min: config.min !== undefined ? String(parseClampedInt(config.min, SUM_MIN, SUM_MAX)) : undefined,
      max: config.max !== undefined ? String(parseClampedInt(config.max, SUM_MIN, SUM_MAX)) : undefined,
      oddCount:
        config.oddCount !== undefined ? String(parseClampedInt(config.oddCount, ODD_COUNT_MIN, ODD_COUNT_MAX)) : undefined,
    };
    return clamped;
  }, {} as RulesState);

export const buildRulesFromState = (state: RulesState): StrategyRule[] =>
  RULE_KINDS.filter((kind) => state[kind].enabled).map((kind): StrategyRule => {
    const config = state[kind];
    if (kind === 'sum-range') {
      return {
        kind,
        params: {
          min: parseClampedInt(config.min, SUM_MIN, SUM_MAX),
          max: parseClampedInt(config.max, SUM_MIN, SUM_MAX),
        },
      };
    }
    if (kind === 'parity-target') {
      return { kind, params: { oddCount: parseClampedInt(config.oddCount, ODD_COUNT_MIN, ODD_COUNT_MAX) } };
    }
    if (kind === 'decade-spread') return { kind };
    return { kind, weight: parseClampedInt(config.weight, WEIGHT_MIN, WEIGHT_MAX) };
  });
