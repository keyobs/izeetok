import type { StrategyRule, StrategyRuleKind } from '../../analysis/strategy/Strategy.ts';

export interface RuleConfigState {
  enabled: boolean;
  weight: number;
  min?: number;
  max?: number;
  oddCount?: number;
}

export type RulesState = Record<StrategyRuleKind, RuleConfigState>;

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
  'number-frequency': { enabled: true, weight: 1 },
  'above-31': { enabled: false, weight: 1 },
  'repeat-from-previous': { enabled: false, weight: 1 },
  recency: { enabled: false, weight: 1 },
  'decade-spread': { enabled: false, weight: 1 },
  'sum-range': { enabled: false, weight: 1, min: 100, max: 150 },
  'parity-target': { enabled: false, weight: 1, oddCount: 3 },
  'star-frequency': { enabled: true, weight: 1 },
};

export const buildRulesFromState = (state: RulesState): StrategyRule[] =>
  RULE_KINDS.filter((kind) => state[kind].enabled).map((kind): StrategyRule => {
    const config = state[kind];
    if (kind === 'sum-range') return { kind, params: { min: config.min, max: config.max } };
    if (kind === 'parity-target') return { kind, params: { oddCount: config.oddCount } };
    if (kind === 'decade-spread') return { kind };
    return { kind, weight: config.weight };
  });
