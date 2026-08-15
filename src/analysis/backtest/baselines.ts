import type { Draw } from '../draw/Draw.ts';
import type { Grid } from '../grid/Grid.ts';
import { parseGrid } from '../grid/Grid.ts';
import { proposeGrid } from '../strategy/proposeGrid.ts';

export type BaselineKind = 'uniform-random' | 'fixed-grid' | 'frequent-numbers' | 'rare-numbers' | 'geometric-no-temporal';

export const BASELINE_KINDS: BaselineKind[] = [
  'uniform-random',
  'fixed-grid',
  'frequent-numbers',
  'rare-numbers',
  'geometric-no-temporal',
];

export const BASELINE_LABELS: Record<BaselineKind, string> = {
  'uniform-random': 'Sélection uniforme aléatoire',
  'fixed-grid': 'Grille fixe',
  'frequent-numbers': 'Numéros historiquement fréquents',
  'rare-numbers': 'Numéros historiquement rares',
  'geometric-no-temporal': 'Modèle géométrique sans composante temporelle',
};

// Arbitrary, documented reference point - not chosen for any structural property.
const FIXED_GRID: Grid = parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });

/**
 * Every baseline but fixed-grid is itself just a Strategy with a specific
 * rule set - reusing proposeGrid keeps the baselines honest (same code
 * path a user's own strategy would go through) instead of a parallel
 * bespoke implementation for each one.
 */
export const proposeBaselineGrid = (kind: BaselineKind, history: Draw[], seed: number): Grid => {
  switch (kind) {
    case 'uniform-random':
      return proposeGrid({ id: `baseline-${kind}`, name: BASELINE_LABELS[kind], rules: [], seed }, history);
    case 'fixed-grid':
      return FIXED_GRID;
    case 'frequent-numbers':
      return proposeGrid(
        {
          id: `baseline-${kind}`,
          name: BASELINE_LABELS[kind],
          rules: [{ kind: 'number-frequency' }, { kind: 'star-frequency' }],
          seed,
        },
        history,
      );
    case 'rare-numbers':
      return proposeGrid(
        {
          id: `baseline-${kind}`,
          name: BASELINE_LABELS[kind],
          rules: [
            { kind: 'number-frequency', weight: -1 },
            { kind: 'star-frequency', weight: -1 },
          ],
          seed,
        },
        history,
      );
    case 'geometric-no-temporal':
      return proposeGrid(
        {
          id: `baseline-${kind}`,
          name: BASELINE_LABELS[kind],
          rules: [{ kind: 'number-frequency' }, { kind: 'decade-spread' }, { kind: 'star-frequency' }],
          seed,
        },
        history,
      );
  }
};
