import type { VariationKind } from './generateVariations.ts';

export const VARIATION_LABELS: Record<VariationKind, string> = {
  'structurally-common': 'Structurellement courante',
  balanced: 'Équilibrée',
  'anti-share': 'Anti-partage',
};

export const VARIATION_DESCRIPTIONS: Record<VariationKind, string> = {
  'structurally-common':
    'Reproduit un profil (somme, répartition par dizaine, écarts) proche des tirages historiquement fréquents.',
  balanced:
    'Répartit les numéros sur les cinq dizaines et équilibre pairs/impairs, pour une grille aux caractéristiques neutres.',
  'anti-share':
    'Moins de chance de partager un gain, car elle évite les numéros calendaires (≤31) que beaucoup de joueurs choisissent - cela ne change pas vos chances de gagner.',
};
